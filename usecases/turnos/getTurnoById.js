import AppError from "../../errors/AppError.js";

/**
 * Caso de uso: obtener un turno por id.
 * Devuelve el turno o null si no existe (el controller decide el 404).
 * Regla de acceso: un cliente (rol "user") solo puede ver sus propios turnos; el admin ve todos.
 */
async function getTurnoById(id, actor, dao) {
  const turno = await dao.getById(id);
  if (turno && actor.rol !== "admin" && turno.clienteId !== actor.id) {
    throw new AppError("PROHIBIDO", "No tenés permiso para ver este turno", 403);
  }
  return turno;
}

export default getTurnoById;