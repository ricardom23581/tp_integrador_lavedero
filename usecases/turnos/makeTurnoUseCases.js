import getTurnos from "./getTurnos.js";
import getTurnoById from "./getTurnoById.js";
import createTurno from "./createTurno.js";
import updateTurno from "./updateTurno.js";
import deleteTurno from "./deleteTurno.js";

/**
 * Factory de casos de uso de turnos.
 * Recibe el DAO de turnos y el de usuarios (para validar la relación al crear).
 */
function makeTurnoUseCases(dao, usuariosDao) {
  return {
    getTurnos: (filters) => getTurnos(filters, dao),
    getTurnoById: (id) => getTurnoById(id, dao),
    createTurno: (data) => createTurno(data, dao, usuariosDao),
    updateTurno: (id, cambios) => updateTurno(id, cambios, dao),
    deleteTurno: (id) => deleteTurno(id, dao),
  };
}

export default makeTurnoUseCases;