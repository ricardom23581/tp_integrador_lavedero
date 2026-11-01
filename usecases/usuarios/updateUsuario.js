import AppError from "../../errors/AppError.js";
import usuarioPublico from "./usuarioPublico.js";

/**
 * Caso de uso: actualizar un usuario.
 * Regla de negocio: si cambia el email, no puede ser el de otro usuario (409).
 * Devuelve el usuario actualizado (sin password) o null si no existe.
 */
async function updateUsuario(id, cambios, dao) {
  if (cambios.email) {
    const existente = await dao.getByEmail(cambios.email);
    if (existente && existente.id !== id) {
      throw new AppError("EMAIL_DUPLICADO", "Ese email ya está registrado", 409);
    }
  }
  return usuarioPublico(await dao.update(id, cambios));
}

export default updateUsuario;