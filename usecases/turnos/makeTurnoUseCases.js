import getTurnos from "./getTurnos.js";
import getTurnoById from "./getTurnoById.js";
import createTurno from "./createTurno.js";
import updateTurno from "./updateTurno.js";
import deleteTurno from "./deleteTurno.js";

/**
 * Factory de casos de uso de turnos.
 * Recibe el DAO y lo inyecta en cada caso de uso, así el controller
 * nunca conoce un DAO concreto.
 */
function makeTurnoUseCases(dao) {
  return {
    getTurnos: (filters) => getTurnos(filters, dao),
    getTurnoById: (id) => getTurnoById(id, dao),
    createTurno: (data) => createTurno(data, dao),
    updateTurno: (id, cambios) => updateTurno(id, cambios, dao),
    deleteTurno: (id) => deleteTurno(id, dao),
  };
}

export default makeTurnoUseCases;