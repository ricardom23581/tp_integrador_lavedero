import AppError from "../../errors/AppError.js";

/**
 * Caso de uso: eliminar un usuario.
 * Reglas de negocio:
 *  - No se puede eliminar a un admin (409).
 *  - Al eliminar un usuario se eliminan también sus turnos.
 * Devuelve true si se borró o false si no existía.
 */
async function deleteUsuario(id, dao, turnosDao) {
  const usuario = await dao.getById(id);
  if (!usuario) return false;

  if (usuario.rol === "admin") {
    throw new AppError("ADMIN_NO_ELIMINABLE", "No se puede eliminar a un administrador", 409);
  }

  await turnosDao.deleteByClienteId(id);
  return dao.delete(id);
}

export default deleteUsuario;