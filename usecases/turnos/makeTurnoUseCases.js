import getTurnos from "./getTurnos.js";
import getTurnoById from "./getTurnoById.js";
import createTurno from "./createTurno.js";
import updateTurno from "./updateTurno.js";
import deleteTurno from "./deleteTurno.js";
import getTurnoDetalle from "./getTurnoDetalle.js";
import exportTurnosCsv from "./exportTurnosCsv.js";
import reprogramarTurno from "./reprogramarTurno.js";

/**
 * Factory de casos de uso de turnos.
 * Recibe un objeto con todas las dependencias: el DAO de turnos, el de usuarios (para validar la relación),
 * el bus de eventos y el calendario de feriados.
 * Clase 13: además el reloj (`clock`) y los números de las reglas (`reglas`: maxPendientes,
 * diasHabilesAnticipacion, maxReprogramaciones). Todo inyectado: ningún caso de uso lee config ni la hora real.
 * Con un objeto (en vez de parámetros sueltos) agregar una dependencia no obliga a cambiar el orden de nada.
 */
function makeTurnoUseCases({ turnosDao, usuariosDao, events, calendario, clock, reglas }) {
  const deps = { turnosDao, usuariosDao, events, calendario, clock, reglas };
  return {
    getTurnos: (filters, actor) => getTurnos(filters, actor, deps),
    getTurnoById: (id, actor) => getTurnoById(id, actor, deps),
    createTurno: (data, actor) => createTurno(data, actor, deps),
    updateTurno: (id, cambios) => updateTurno(id, cambios, deps),
    deleteTurno: (id) => deleteTurno(id, deps),
    reprogramarTurno: (id, datos, actor) => reprogramarTurno(id, datos, actor, deps), // Clase 13
    // Clase 12
    getTurnoDetalle: (id, actor) => getTurnoDetalle(id, actor, deps),
    exportTurnosCsv: (params, actor) =>
      exportTurnosCsv(params, actor, (filtros, a) => getTurnos(filtros, a, deps), deps),
  };
}

export default makeTurnoUseCases;