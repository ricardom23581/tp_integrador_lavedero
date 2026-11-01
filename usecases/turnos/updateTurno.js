/**
 * Caso de uso: actualizar un turno.
 * Devuelve el turno actualizado o null si no existe.
 */
async function updateTurno(id, cambios, dao) {
  return dao.update(id, cambios);
}

export default updateTurno;