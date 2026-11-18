import createUsuario from "../usuarios/createUsuario.js";

/**
 * Caso de uso: autoregistro público (POST /api/auth/register).
 * Reutiliza createUsuario (email duplicado → 409, hash de la contraseña y rol "user" forzado):
 * nadie puede darse permisos de admin al registrarse.
 */
async function registerUsuario(data, dao, hasher) {
  return createUsuario(data, dao, hasher);
}

export default registerUsuario;