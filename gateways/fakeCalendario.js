import AppError from "../errors/AppError.js";

// Datos de EJEMPLO que imitan lo que devolvería la API (no son el calendario oficial completo)
const FERIADOS_FAKE = [
  { fecha: "2026-01-01", nombre: "Año nuevo", tipo: "inamovible" },
  { fecha: "2026-03-24", nombre: "Día Nacional de la Memoria por la Verdad y la Justicia", tipo: "inamovible" },
  { fecha: "2026-04-02", nombre: "Día del Veterano y de los Caídos en la Guerra de Malvinas", tipo: "inamovible" },
  { fecha: "2026-05-01", nombre: "Día del Trabajador", tipo: "inamovible" },
  { fecha: "2026-05-25", nombre: "Día de la Revolución de Mayo", tipo: "inamovible" },
  { fecha: "2026-07-09", nombre: "Día de la Independencia", tipo: "inamovible" },
  { fecha: "2026-11-23", nombre: "Día de la Soberanía Nacional", tipo: "trasladable" },
  { fecha: "2026-12-08", nombre: "Inmaculada Concepción de María", tipo: "inamovible" },
  { fecha: "2026-12-25", nombre: "Navidad", tipo: "inamovible" },
  { fecha: "2027-01-01", nombre: "Año nuevo", tipo: "inamovible" },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Calendario falso: misma interfaz que el gateway real, sin red.
 * Cada "pedido" tarda `latencyMs` (como un pedido HTTP real), así se nota la diferencia entre
 * pedir de a uno, en paralelo o agrupado, incluso sin internet.
 * El año 1999 simula una falla del servidor externo (para probar los errores).
 */
function createFakeCalendario({ latencyMs }) {
  async function fetchAnio(anio) {
    await sleep(latencyMs);
    if (String(anio) === "1999") {
      throw new AppError("EXTERNAL_API_ERROR", "El calendario de feriados respondió 500", 502);
    }
    return FERIADOS_FAKE.filter((f) => f.fecha.startsWith(`${anio}-`));
  }

  return {
    async getFeriado(fecha) {
      const feriados = await fetchAnio(fecha.slice(0, 4));
      return feriados.find((f) => f.fecha === fecha) ?? null;
    },

    async getFeriadosDeAnios(anios) {
      const unicos = [...new Set(anios.map(String))];
      const listas = await Promise.all(unicos.map((anio) => fetchAnio(anio)));
      return Object.fromEntries(listas.flat().map((f) => [f.fecha, { ...f }]));
    },
  };
}

export default createFakeCalendario;