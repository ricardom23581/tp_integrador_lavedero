/**
 * Controller de turnos: traduce HTTP (req/res) a operaciones sobre los datos.
 * Por ahora habla directo con el DAO; en la clase 7 se meten los casos de uso en el medio.
 */
export function makeTurnosController(turnosDao) {
  const listar = async (req, res) => {
    const turnos = await turnosDao.getAll();
    res.status(200).json(turnos);
  };

  const obtener = async (req, res) => {
    const id = Number(req.params.id);
    const turno = await turnosDao.getById(id);
    if (!turno) {
      return res.status(404).json({ error: `No existe un turno con id ${id}` });
    }
    res.status(200).json(turno);
  };

  const crear = async (req, res) => {
    const { clienteId, patente, fecha, tipoVehiculo } = req.body ?? {};
    if (!clienteId || !patente || !fecha || !tipoVehiculo) {
      return res.status(400).json({
        error: "Faltan campos obligatorios: clienteId, patente, fecha, tipoVehiculo",
      });
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
    if (!actualizado) {
      return res.status(404).json({ error: `No existe un turno con id ${id}` });
    }
    res.status(200).json(actualizado);
  };

  const eliminar = async (req, res) => {
    const id = Number(req.params.id);
    const borrado = await turnosDao.delete(id);
    if (!borrado) {
      return res.status(404).json({ error: `No existe un turno con id ${id}` });
    }
    res.status(204).end();
  };

  return { listar, obtener, crear, actualizar, eliminar };
}