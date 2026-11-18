import getTurnos from "./getTurnos.js";
import getTurnoById from "./getTurnoById.js";
import createTurno from "./createTurno.js";
import updateTurno from "./updateTurno.js";
import deleteTurno from "./deleteTurno.js";

/**
 * Factory de casos de uso de turnos.
 * Recibe el DAO de turnos el de usuarios (para validar la relación al crear) y el bus de eventos.
 */
function makeTurnoUseCases(dao, usuariosDao, events) {
  return {
    getTurnos: (filters, actor) => getTurnos(filters, actor, dao),
    getTurnoById: (id, actor) => getTurnoById(id, actor, dao),
    createTurno: (data, actor) => createTurno(data, actor, dao, usuariosDao, events),
    updateTurno: (id, cambios) => updateTurno(id, cambios, dao, events),
    deleteTurno: (id) => deleteTurno(id, dao),
  };
}

export default makeTurnoUseCases;
