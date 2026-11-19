import AppError from "../../errors/AppError.js";
import { EVENTS } from "../../events/eventNames.js";
import { conSituacion, ESTADO_PENDIENTE } from "../../domain/situacionTurno.js";
import { validarFechaFutura, validarCalendario } from "./reglasDeFecha.js";

import assertSinAusencias from "./assertSinAusencias.js"; // ← NUEVO (Clase 14 - Ej. 10.3)

// Ejercicio 8.6 — Status codes de POST /api/turnos:
//   | Situación                                  | Status | code                                      |
//   |--------------------------------------------|--------|-------------------------------------------|
//   | Body sin patente / horario fuera de rango  | 400    | VALIDACION (Zod, en el router)            |
//   | Sin token                                  | 401    | TOKEN_FALTANTE (middleware authenticate)  |
//   | Un cliente pide a nombre de otro           | 403    | PROHIBIDO                                 |
//   | El cliente no existe                       | 404    | USUARIO_NO_ENCONTRADO                     |
//   | La fecha ya pasó                           | 422    | FECHA_PASADA                              |
//   | Ya tiene un turno pendiente con esa patente| 409    | PATENTE_CON_TURNO_PENDIENTE               |
//   | Tiene un turno ausente                     | 409    | CLIENTE_CON_AUSENCIAS                     |
//   | Ya tiene 3 turnos pendientes               | 409    | LIMITE_TURNOS_PENDIENTES                  |
//   | Más allá de los días hábiles permitidos    | 422    | FECHA_FUERA_DE_RANGO                      |
//   | Es feriado                                 | 422    | FECHA_FERIADO                             |
//   | La API de feriados está caída              | 201    | — (degrada: feriadosDisponibles: false)   |
//
// ¿409 o 422? 409 (Conflict) cuando el pedido choca con el ESTADO actual de los recursos (los otros turnos del
// cliente): el mismo pedido podría andar mañana si ese estado cambia. 422 cuando el dato está bien formado
// pero la regla lo rechaza por sí mismo (una fecha pasada, un feriado): hay que mandar otra fecha.
//
// Ejercicio 5.4 — ¿Por qué el calendario se consulta DESPUÉS de las demás reglas? Porque es lo más caro (un pedido
// a un tercero) y fail fast: si el pedido igual va a ser rechazado por R1 o R3, no tiene sentido gastar ese pedido.
//
// Ejercicio 1.2 — El tope es configuración: si el lavadero decide que son 5, se cambia una variable de entorno
// sin tocar ni redesplegar código, y en los tests se puede pasar cualquier valor.

/**
 * Caso de uso: crear un turno.
 * Reglas, en orden del chequeo más barato al más caro (fail fast):
 *  1. Permiso (403): un cliente solo saca turnos a su nombre; el admin puede indicar clienteId
 *     (por ejemplo, para cargar un turno que pidieron por teléfono).
 *  2. Existencia (404): el cliente tiene que existir.
 *  3. Fecha futura (422 FECHA_PASADA): no se dan turnos para un momento que ya pasó.
 *  4. Estado (409 PATENTE_CON_TURNO_PENDIENTE): el cliente no puede tener dos turnos pendientes para el mismo vehículo.
 *  5. R3 (409 CLIENTE_CON_AUSENCIAS): un cliente con algún turno ausente no puede sacar otro.
 *  6. R1 (409 LIMITE_TURNOS_PENDIENTES): como máximo `maxPendientes` turnos pendientes.
 *  7. R2 + feriados (422): dentro de los próximos `diasHabilesAnticipacion` días hábiles, y no un feriado.
 *  El estado inicial lo fija el servidor, nunca el cliente.
 *
 * ¿Por qué el permiso va acá y no en el router con authorize()? authorize("admin") solo mira el ROL.
 * Esta regla depende de los DATOS del pedido (el clienteId comparado con el id del que pide) y tiene que
 * cumplirse aunque mañana el caso de uso se llame desde otro lado (un script, un evento, un test).
 *
 * Clase 13: ninguna regla lee process.env, new Date() ni fetch. Los números (reglas), el reloj (clock)
 * y el calendario llegan inyectados: el caso de uso es determinista y se puede testear.
 */
async function createTurno(data, actor, { turnosDao, usuariosDao, events, calendario, clock, reglas }) {
  const clienteId = data.clienteId ?? actor.id;
  if (actor.rol !== "admin" && clienteId !== actor.id) {
    throw new AppError("PROHIBIDO", "Solo podés sacar turnos a tu nombre", 403);
  }

  const usuario = await usuariosDao.getById(clienteId);
  if (!usuario) {
    throw new AppError("USUARIO_NO_ENCONTRADO", `No existe un usuario con id ${clienteId}`, 404);
  }

  validarFechaFutura(data.fecha, clock.ahora());

  // Una sola consulta alcanza para las tres reglas que miran los turnos pendientes del cliente
  const hoy = clock.hoy();
  const pendientes = await turnosDao.getAll({ clienteId, estado: ESTADO_PENDIENTE });

  if (pendientes.some((t) => t.patente === data.patente)) {
    throw new AppError("PATENTE_CON_TURNO_PENDIENTE", `Ya tenés un turno pendiente para la patente ${data.patente}`, 409);
  }

  // R3 va antes que R1: si tiene un turno ausente, el mensaje útil es "resolvé eso", no "llegaste al tope"
    assertSinAusencias(pendientes, hoy, "sacar otro"); // ← CAMBIÓ (Clase 14 - Ej. 10.3): regla compartida con R6

  // R1: los ausentes ya cortaron arriba, así que acá todos los pendientes son a futuro (o de hoy)
  if (pendientes.length >= reglas.maxPendientes) {
    throw new AppError(
      "LIMITE_TURNOS_PENDIENTES",
      `Un cliente puede tener hasta ${reglas.maxPendientes} turnos pendientes`,
      409
    );
  }

  // R2 + feriados: recién ahora, con todas las reglas superadas, se consulta el calendario (lo más caro va al final)
  const { feriadosDisponibles } = await validarCalendario({
    fecha: data.fecha,
    hoy,
    diasHabiles: reglas.diasHabilesAnticipacion,
    calendario,
  });

    // Entre la consulta de arriba y este alta, otro pedido simultáneo podría colarse (condición de carrera).
  // El duplicado de patente lo frena el índice único de la base, y el tope (Ejercicio 9.1) lo vuelve a contar
  // el DAO dentro de la misma transacción del alta: por eso le pasamos maxPendientes.
  // El chequeo de arriba se mantiene: resuelve el caso normal sin abrir una transacción ni consultar el calendario.
  const turno = await turnosDao.save({
    ...data,
    clienteId,
    estado: ESTADO_PENDIENTE,
    maxPendientes: reglas.maxPendientes,
  });
  
  // Se anuncia recién cuando el turno ya está guardado
  events.emit(EVENTS.TURNO_CREADO, turno);
  return { ...conSituacion(turno, hoy), feriadosDisponibles };
}

export default createTurno;