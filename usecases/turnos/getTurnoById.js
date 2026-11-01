/**
 * Caso de uso: obtener un turno por id.
 * Devuelve el turno o null si no existe (el controller decide el 404).
 */
async function getTurnoById(id, dao) {
  return dao.getById(id);
}

export default getTurnoById;