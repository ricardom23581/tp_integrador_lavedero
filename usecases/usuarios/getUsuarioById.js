import usuarioPublico from "./usuarioPublico.js";

/**
 * Caso de uso: obtener un usuario por id (sin password).
 * Devuelve el usuario o null si no existe.
 */
async function getUsuarioById(id, dao) {
  return usuarioPublico(await dao.getById(id));
}

export default getUsuarioById;