/**
 * Caso de uso: eliminar un turno.
 * Devuelve true si se borró o false si no existía.
 */
async function deleteTurno(id, { turnosDao }) {
  return turnosDao.delete(id);
}

export default deleteTurno;