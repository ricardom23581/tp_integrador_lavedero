import AppError from "../../errors/AppError.js";
import usuarioPublico from "./usuarioPublico.js";

/**
 * Caso de uso: actualizar un usuario.
 * Regla de negocio: si cambia el email, no puede ser el de otro usuario (409).
 * Si viene "password", se hashea antes de guardar (el DAO solo conoce passwordHash).
 * Devuelve el usuario actualizado (sin hash) o null si no existe.
 */
async function updateUsuario(id, cambios, dao, hasher) {
  if (cambios.email) {
    const existente = await dao.getByEmail(cambios.email);
    if (existente && existente.id !== id) {
      throw new AppError("EMAIL_DUPLICADO", "Ese email ya está registrado", 409);
    }
  }

  const { password, ...resto } = cambios;
  const datos = password ? { ...resto, passwordHash: await hasher.hash(password) } : resto;

  return usuarioPublico(await dao.update(id, datos));
}

export default updateUsuario;