/**
 * Caso de uso: crear un turno.
 * El estado inicial lo fija el servidor, nunca el cliente.
 */
async function createTurno(data, dao) {
  return dao.save({ ...data, estado: "Esperando el servicio" });
}

export default createTurno;