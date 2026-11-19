import AppError from "../../errors/AppError.js";
import { estaAusente, conSituacion, ESTADO_PENDIENTE } from "../../domain/situacionTurno.js";
import { validarFechaFutura, validarCalendario } from "./reglasDeFecha.js";

/**
 * Caso de uso: reprogramar un turno (regla R4).
 * Una regla de negocio suele ser una CADENA de condiciones, cada una con su propio `code`,
 * en el orden de siempre: existencia → permiso → estado → regla.
 *  - TURNO_NO_ENCONTRADO (404)        el turno no existe
 *  - PROHIBIDO (403)                  un cliente solo reprograma los suyos
 *  - TURNO_YA_ATENDIDO (409)          no se reprograma un turno en proceso o finalizado
 *  - TURNO_AUSENTE (409)              un turno al que no se presentó no se reprograma: hay que resolverlo
 *  - LIMITE_REPROGRAMACIONES (409)    se reprograma como máximo `maxReprogramaciones` veces
 *  - FECHA_PASADA / FECHA_FUERA_DE_RANGO / FECHA_FERIADO (422)   la nueva fecha cumple las mismas reglas que al crear
 * La anticipación se cuenta desde HOY (no desde la fecha anterior del turno): es un turno nuevo en el calendario.
 */
async function reprogramarTurno(id, { fecha }, actor, { turnosDao, calendario, clock, reglas }) {
  const turno = await turnosDao.getById(id);
  if (!turno) {
    throw new AppError("TURNO_NO_ENCONTRADO", `No existe un turno con id ${id}`, 404);
  }
  if (actor.rol !== "admin" && turno.clienteId !== actor.id) {
    throw new AppError("PROHIBIDO", "No tenés permiso para reprogramar este turno", 403);
  }
  if (turno.estado !== ESTADO_PENDIENTE) {
    throw new AppError("TURNO_YA_ATENDIDO", `El turno ya está "${turno.estado}": no se puede reprogramar`, 409);
  }

  const hoy = clock.hoy();
  if (estaAusente(turno, hoy)) {
    throw new AppError("TURNO_AUSENTE", "El cliente no se presentó a este turno: no se puede reprogramar", 409);
  }
  if (turno.reprogramaciones >= reglas.maxReprogramaciones) {
    throw new AppError(
      "LIMITE_REPROGRAMACIONES",
      `Un turno se puede reprogramar como máximo ${reglas.maxReprogramaciones} ${reglas.maxReprogramaciones === 1 ? "vez" : "veces"}`,
      409
    );
  }

  validarFechaFutura(fecha, clock.ahora());
  const { feriadosDisponibles } = await validarCalendario({
    fecha,
    hoy,
    diasHabiles: reglas.diasHabilesAnticipacion,
    calendario,
  });

  // UPDATE condicional: si otro pedido lo atendió o lo reprogramó mientras tanto, no pisa nada
  const reprogramado = await turnosDao.reprogramar(id, { fecha, reprogramacionesPrevias: turno.reprogramaciones });
  if (!reprogramado) {
    throw new AppError("TURNO_CAMBIO", "El turno cambió mientras se procesaba el pedido: volvé a intentarlo", 409);
  }

  return { ...conSituacion(reprogramado, hoy), feriadosDisponibles };
}

export default reprogramarTurno;