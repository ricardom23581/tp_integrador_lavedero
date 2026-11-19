import verificarFechas from "./verificarFechas.js";

/**
 * Factory de casos de uso de feriados.
 * Recibe el calendario (real o falso) y las opciones por inyección: no lee config.js.
 */
function makeFeriadoUseCases(calendario, { concurrency }) {
  return {
    verificarFechas: (params) => verificarFechas(params, calendario, { concurrency }),
  };
}

export default makeFeriadoUseCases;