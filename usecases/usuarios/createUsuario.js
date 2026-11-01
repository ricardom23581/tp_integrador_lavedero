import AppError from "../../errors/AppError.js";
import usuarioPublico from "./usuarioPublico.js";

/**
 * Caso de uso: registrar un usuario.
 * Regla de negocio: el email no se puede repetir (409).
 * El rol lo fija el servidor: todo registro es "user".
 */
async function createUsuario(data, dao) {
  const existente = await dao.getByEmail(data.email);
  if (existente) {
    throw new AppError("EMAIL_DUPLICADO", "Ese email ya está registrado", 409);
  }
  return usuarioPublico(await dao.save({ ...data, rol: "user" }));
}

export default createUsuario;