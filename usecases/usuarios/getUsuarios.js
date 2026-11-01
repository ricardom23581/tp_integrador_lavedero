import usuarioPublico from "./usuarioPublico.js";

/**
 * Caso de uso: listar usuarios con filtro por rol y paginación.
 * Devuelve { items, total }: total es la cantidad antes de paginar.
 */
async function getUsuarios(filters, dao) {
  const { rol, page, limit } = filters;

  let usuarios = await dao.getAll();
  if (rol) usuarios = usuarios.filter((u) => u.rol === rol);

  const total = usuarios.length;
  const desde = (page - 1) * limit;
  return { items: usuarios.slice(desde, desde + limit).map(usuarioPublico), total };
}

export default getUsuarios;