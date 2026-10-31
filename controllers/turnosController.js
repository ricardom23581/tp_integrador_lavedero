/**
 * Controller de turnos: traduce HTTP (req/res) a operaciones sobre los datos.
 * Por ahora habla directo con el DAO; en la clase 7 se meten los casos de uso en el medio.
 * Todos los errores salen con el formato { error: { code, message } }.
 */

// Helpers para no repetir el formato de error en cada handler
const errorTurnoNoEncontrado = (id) => ({
  error: { code: "TURNO_NO_ENCONTRADO", message: `No existe un turno con id ${id}` },
});

const errorDatosIncompletos = () => ({
  error: {
    code: "DATOS_INCOMPLETOS",
    message: "Faltan campos obligatorios: clienteId, patente, fecha, tipoVehiculo",
  },
});

// Campos por los que se puede ordenar con ?sort=campo o ?sort=-campo
const CAMPOS_ORDENABLES = ["id", "fecha", "patente", "estado", "tipoVehiculo"];

export function makeTurnosController(turnosDao) {
  const listar = async (req, res) => {
    let turnos = await turnosDao.getAll();

    // 1) Filtros: GET /api/turnos?estado=...&tipoVehiculo=...&clienteId=2&fecha=2026-11-03
    const { estado, tipoVehiculo, clienteId, fecha, patente, sort } = req.query;

    if (estado) turnos = turnos.filter((t) => t.estado === estado);
    if (tipoVehiculo) turnos = turnos.filter((t) => t.tipoVehiculo === tipoVehiculo);
    if (clienteId) turnos = turnos.filter((t) => t.clienteId === Number(clienteId));
    if (fecha) turnos = turnos.filter((t) => t.fecha.startsWith(fecha)); // día completo
    if (patente) turnos = turnos.filter((t) => t.patente === patente.toUpperCase());

    // 2) Orden: ?sort=fecha (ascendente) o ?sort=-fecha (descendente)
    if (sort) {
      const desc = sort.startsWith("-");
      const campo = desc ? sort.slice(1) : sort;
      if (CAMPOS_ORDENABLES.includes(campo)) {
        turnos.sort((a, b) => {
          if (a[campo] < b[campo]) return desc ? 1 : -1;
          if (a[campo] > b[campo]) return desc ? -1 : 1;
          return 0;
        });
      }
    }

    // 3) Paginación: ?page=2&limit=10 (los query params llegan como string)
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const desde = (page - 1) * limit;
    const pagina = turnos.slice(desde, desde + limit);

    // El total va en un header para que el body siga siendo un array (lo que espera el front)
    res.set("X-Total-Count", String(turnos.length));
    res.status(200).json(pagina);
  };

  const obtener = async (req, res) => {
    const id = Number(req.params.id);
    const turno = await turnosDao.getById(id);
    if (!turno) return res.status(404).json(errorTurnoNoEncontrado(id));
    res.status(200).json(turno);
  };

  const crear = async (req, res) => {
    const { clienteId, patente, fecha, tipoVehiculo } = req.body ?? {};
    if (!clienteId || !patente || !fecha || !tipoVehiculo) {
      return res.status(400).json(errorDatosIncompletos());
    }
    const nuevo = await turnosDao.save({
      clienteId,
      patente,
      fecha,
      tipoVehiculo,
      estado: "Esperando el servicio",
    });
    res.status(201).json(nuevo);
  };

  const actualizar = async (req, res) => {
    const id = Number(req.params.id);
    const actualizado = await turnosDao.update(id, req.body ?? {});
    if (!actualizado) return res.status(404).json(errorTurnoNoEncontrado(id));
    res.status(200).json(actualizado);
  };

  const eliminar = async (req, res) => {
    const id = Number(req.params.id);
    const borrado = await turnosDao.delete(id);
    if (!borrado) return res.status(404).json(errorTurnoNoEncontrado(id));
    res.status(204).end();
  };

  return { listar, obtener, crear, actualizar, eliminar };
}