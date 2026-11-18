import AppError from "../../errors/AppError.js";
import { EVENTS } from "../../events/eventNames.js";

/**
 * Caso de uso: crear un turno.
 * Reglas de negocio:
 *  - Un cliente (rol "user") solo puede sacar turnos a su nombre. Si no manda clienteId,
 *    el turno es suyo; si manda el de otro, 403. El admin puede indicar cualquier clienteId
 *    (por ejemplo, para cargar un turno que pidieron por teléfono).
 *  - El usuario (clienteId) tiene que existir (404).
 *  - El estado inicial lo fija el servidor, nunca el cliente.
 *
 * ¿Por qué esta regla va acá y no en el router con authorize()?
 * authorize("admin") solo mira el ROL, que se conoce antes de ejecutar nada. Esta regla depende
 * de los DATOS del pedido (el clienteId comparado con el id del que pide) y es una regla de negocio:
 * tiene que cumplirse aunque mañana el caso de uso se llame desde otro lado (un script, un evento,
 * un test) sin pasar por Express.
 */
async function createTurno(data, actor, dao, usuariosDao, events) {
  const clienteId = data.clienteId ?? actor.id;
  if (actor.rol !== "admin" && clienteId !== actor.id) {
    throw new AppError("PROHIBIDO", "Solo podés sacar turnos a tu nombre", 403);
  }

  const usuario = await usuariosDao.getById(clienteId);
  if (!usuario) {
    throw new AppError("USUARIO_NO_ENCONTRADO", `No existe un usuario con id ${clienteId}`, 404);
  }

  const turno = await dao.save({ ...data, clienteId, estado: "Esperando el servicio" });

  // Se anuncia recién cuando el turno ya está guardado
  events.emit(EVENTS.TURNO_CREADO, turno);
  return turno;
}

export default createTurno;