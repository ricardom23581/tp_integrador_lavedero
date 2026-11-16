import { EVENTS } from "../../events/eventNames.js";

const ESTADO_FINALIZADO = "Lavado finalizado";

/**
 * Caso de uso: actualizar un turno.
 * Devuelve el turno actualizado o null si no existe.
 * Emite "turno.finalizado" solo cuando el estado PASA a "Lavado finalizado"
 * (no si ya lo estaba, así no se avisa dos veces).
 */
async function updateTurno(id, cambios, dao, events) {
  const anterior = await dao.getById(id);
  if (!anterior) return null;

  const actualizado = await dao.update(id, cambios);
  if (!actualizado) return null;

  if (anterior.estado !== ESTADO_FINALIZADO && actualizado.estado === ESTADO_FINALIZADO) {
    events.emit(EVENTS.TURNO_FINALIZADO, actualizado);
  }
  return actualizado;
}

export default updateTurno;