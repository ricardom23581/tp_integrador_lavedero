/**
 * Controller de turnos: traduce HTTP (req/res) a operaciones sobre los datos.
 * Los datos ya llegan validados por Zod (req.body y req.validated).
 * Los errores se lanzan con AppError y los responde el errorHandler.
 * Por ahora habla directo con el DAO; en la clase 7 se meten los casos de uso en el medio.
 */
import AppError from "../errors/AppError.js";

const turnoNoEncontrado = (id) =>
  new AppError("TURNO_NO_ENCONTRADO", `No existe un turno con id ${id}`, 404);

export function makeTurnosController(turnosDao) {
  const listar = async (req, res) => {
    const { estado, tipoVehiculo, clienteId, fecha, patente, sort, page, limit } =
      req.validated.query;

    let turnos = await turnosDao.getAll();

    // 1) Filtros (ya vienen con el tipo correcto gracias a Zod)
    if (estado) turnos = turnos.filter((t) => t.estado === estado);
    if (tipoVehiculo) turnos = turnos.filter((t) => t.tipoVehiculo === tipoVehiculo);
    if (clienteId) turnos = turnos.filter((t) => t.clienteId === clienteId);
    if (fecha) turnos = turnos.filter((t) => t.fecha.startsWith(fecha));
    if (patente) turnos = turnos.filter((t) => t.patente === patente);

    // 2) Orden: Zod ya garantizó que el campo es válido
    if (sort) {
      const desc = sort.startsWith("-");
      const campo = desc ? sort.slice(1) : sort;
      turnos.sort((a, b) => {
        if (a[campo] < b[campo]) return desc ? 1 : -1;
        if (a[campo] > b[campo]) return desc ? -1 : 1;
        return 0;
      });
    }

    // 3) Paginación: page y limit ya son números con default
    const desde = (page - 1) * limit;
    res.set("X-Total-Count", String(turnos.length));
    res.status(200).json(turnos.slice(desde, desde + limit));
  };

  const obtener = async (req, res) => {
    const { id } = req.validated.params;
    const turno = await turnosDao.getById(id);
    if (!turno) throw turnoNoEncontrado(id);
    res.status(200).json(turno);
  };

  const crear = async (req, res) => {
    const nuevo = await turnosDao.save({ ...req.body, estado: "Esperando el servicio" });
    res.status(201).json(nuevo);
  };

  const actualizar = async (req, res) => {
    const { id } = req.validated.params;
    const actualizado = await turnosDao.update(id, req.body);
    if (!actualizado) throw turnoNoEncontrado(id);
    res.status(200).json(actualizado);
  };

  const eliminar = async (req, res) => {
    const { id } = req.validated.params;
    const borrado = await turnosDao.delete(id);
    if (!borrado) throw turnoNoEncontrado(id);
    res.status(204).end();
  };

  return { listar, obtener, crear, actualizar, eliminar };
}