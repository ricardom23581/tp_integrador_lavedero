/**
 * Caso de uso: eliminar un usuario.
 * Devuelve true si se borró o false si no existía.
 * (En el paso 3 se suma: no borrar al admin y borrar también sus turnos.)
 */
async function deleteUsuario(id, dao) {
  return dao.delete(id);
}

export default deleteUsuario;