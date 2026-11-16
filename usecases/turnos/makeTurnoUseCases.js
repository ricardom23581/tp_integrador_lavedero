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
    getTurnos: (filters) => getTurnos(filters, dao),
    getTurnoById: (id) => getTurnoById(id, dao),
    createTurno: (data) => createTurno(data, dao, usuariosDao, events),
    updateTurno: (id, cambios) => updateTurno(id, cambios, dao, events),
    deleteTurno: (id) => deleteTurno(id, dao),
  };
}

export default makeTurnoUseCases;