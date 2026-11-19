/**
 * Controller de turnos: traduce HTTP (req/res) a llamadas a casos de uso.
 * No conoce ningún DAO: recibe los casos de uso ya armados por el container.
 * Los datos ya llegan validados por Zod (req.body y req.validated).
 * Los errores se lanzan con AppError y los responde el errorHandler.
 */
import AppError from "../errors/AppError.js";

const turnoNoEncontrado = (id) =>
  new AppError("TURNO_NO_ENCONTRADO", `No existe un turno con id ${id}`, 404);

export function makeTurnosController(useCases) {
    const listar = async (req, res) => {
    const { items, total } = await useCases.getTurnos(req.validated.query, req.user);
    res.set("X-Total-Count", String(total));
    res.status(200).json(items);
  };

  const obtener = async (req, res) => {
    const { id } = req.validated.params;
    const turno = await useCases.getTurnoById(id, req.user);
    if (!turno) throw turnoNoEncontrado(id);
    res.status(200).json(turno);
  };

    // GET /api/turnos/:id/detalle (Clase 12): turno + si ese día es feriado
  const detalle = async (req, res) => {
    const { id } = req.validated.params;
    const turno = await useCases.getTurnoDetalle(id, req.user);
    if (!turno) throw turnoNoEncontrado(id);
    res.status(200).json(turno);
  };
  
    // GET /api/turnos/export.csv (Clase 12): descarga del listado en CSV
  const exportarCsv = async (req, res) => {
    const { csv, filename, enrichment } = await useCases.exportTurnosCsv(req.validated.query, req.user);
    res.set("X-Enrichment", enrichment); // ok | unavailable | skipped
    res.attachment(filename); // Content-Disposition: attachment (se descarga) + Content-Type: text/csv
    res.send(csv);
  };
  
  const crear = async (req, res) => {
    const nuevo = await useCases.createTurno(req.body, req.user);
    res.status(201).json(nuevo);
  };

  const actualizar = async (req, res) => {
    const { id } = req.validated.params;
    const actualizado = await useCases.updateTurno(id, req.body);
    if (!actualizado) throw turnoNoEncontrado(id);
    res.status(200).json(actualizado);
  };

  const eliminar = async (req, res) => {
    const { id } = req.validated.params;
    const borrado = await useCases.deleteTurno(id);
    if (!borrado) throw turnoNoEncontrado(id);
    res.status(204).end();
  };

  return { listar, obtener, detalle, exportarCsv, crear, actualizar, eliminar };
}