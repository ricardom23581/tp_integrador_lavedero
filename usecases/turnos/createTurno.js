import AppError from "../../errors/AppError.js";
import { EVENTS } from "../../events/eventNames.js";
/**
 * Caso de uso: crear un turno.
 * Regla de negocio: el usuario (clienteId) tiene que existir (404).
 * El estado inicial lo fija el servidor, nunca el cliente.
 * Recibe también el DAO de usuarios para verificar la relación.
 */
async function createTurno(data, dao, usuariosDao, events) {
  const usuario = await usuariosDao.getById(data.clienteId);
  if (!usuario) {
    throw new AppError(
      "USUARIO_NO_ENCONTRADO",
      `No existe un usuario con id ${data.clienteId}`,
      404
    );
  }

  const turno = await dao.save({ ...data, estado: "Esperando el servicio" });

  // Se anuncia recién cuando el turno ya está guardado
  events.emit(EVENTS.TURNO_CREADO, turno);
  return turno;
}

export default createTurno;