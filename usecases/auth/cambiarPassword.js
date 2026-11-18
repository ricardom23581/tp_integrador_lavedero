import AppError from "../../errors/AppError.js";

/**
 * Caso de uso: cambiar la propia contraseña (PUT /api/auth/password).
 * Regla de negocio: hay que demostrar que se conoce la contraseña actual. Así, quien encuentre
 * una sesión abierta (o robe un token) no puede cambiarla y dejar afuera al dueño.
 */
async function cambiarPassword(usuarioId, { passwordActual, passwordNueva }, dao, hasher) {
  const usuario = await dao.getById(usuarioId);
  if (!usuario) {
    throw new AppError("USUARIO_NO_ENCONTRADO", "El usuario del token ya no existe", 404);
  }

  const credenciales = await dao.getCredentialsByEmail(usuario.email);
  if (!(await hasher.compare(passwordActual, credenciales.passwordHash))) {
    throw new AppError("CREDENCIALES_INVALIDAS", "La contraseña actual es incorrecta", 401);
  }

  await dao.update(usuarioId, { passwordHash: await hasher.hash(passwordNueva) });
}

export default cambiarPassword;