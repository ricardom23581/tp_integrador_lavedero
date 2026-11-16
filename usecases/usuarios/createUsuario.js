import AppError from "../../errors/AppError.js";
import usuarioPublico from "./usuarioPublico.js";

/**
 * Caso de uso: registrar un usuario.
 * Regla de negocio: el email no se puede repetir (409).
 * El rol lo fija el servidor: todo registro es "user".
 * La contraseña se hashea acá: el DAO solo recibe y guarda passwordHash.
 */
async function createUsuario(data, dao, hasher) {
  const existente = await dao.getByEmail(data.email);
  if (existente) {
    throw new AppError("EMAIL_DUPLICADO", "Ese email ya está registrado", 409);
  }

  const { password, ...resto } = data;
  const passwordHash = await hasher.hash(password);
  return usuarioPublico(await dao.save({ ...resto, passwordHash, rol: "user" }));
}

export default createUsuario;