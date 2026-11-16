/**
 * Caso de uso: listar turnos con filtros, orden y paginación.
 * Recibe los filtros ya validados por Zod y el dao por parámetro (inversión de dependencias).
 * Devuelve { items, total }: total es la cantidad antes de paginar (para X-Total-Count).
 */
async function getTurnos(filters, dao) {
  const { estado, tipoVehiculo, clienteId, fecha, patente, sort, page, limit } = filters;

  let turnos = await dao.getAll();

  // 1) Filtros
  if (estado) turnos = turnos.filter((t) => t.estado === estado);
  if (tipoVehiculo) turnos = turnos.filter((t) => t.tipoVehiculo === tipoVehiculo);
  if (clienteId) turnos = turnos.filter((t) => t.clienteId === clienteId);
  if (fecha) turnos = turnos.filter((t) => t.fecha.startsWith(fecha));
  if (patente) turnos = turnos.filter((t) => t.patente === patente);

  // 2) Orden (?sort=fecha o ?sort=-fecha)
  if (sort) {
    const desc = sort.startsWith("-");
    const campo = desc ? sort.slice(1) : sort;
    turnos.sort((a, b) => {
      if (a[campo] < b[campo]) return desc ? 1 : -1;
      if (a[campo] > b[campo]) return desc ? -1 : 1;
      return 0;
    });
  }

  // 3) Paginación
  const total = turnos.length;
  const desde = (page - 1) * limit;
  return { items: turnos.slice(desde, desde + limit), total };
}

export default getTurnos;