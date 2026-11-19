import AppError from "../errors/AppError.js";

/*
 * Ej. 1 — Lo que se ve consultando la API a mano (https://api.argentinadatos.com/v1/feriados/2026):
 *  - Devuelve un ARREGLO con todos los feriados del año: [{ fecha: "2026-01-01", tipo: "inamovible", nombre: "..." }, ...].
 *  - No hay un endpoint "¿esta fecha es feriado?": siempre se pide el año completo y se busca la fecha.
 *    Por eso consultar 5 fechas del mismo año de a una son 5 pedidos, pero agrupadas por año es 1 solo.
 *
 *  *
 * — Decisión de NEGOCIO (no técnica): la API marca algunos días como "puente" (no laborables, optativos).
 *  El lavadero cierra esos días, así que los contamos como feriados (no hábiles) igual que los inamovibles y
 *  trasladables: getFeriado los devuelve y la regla FECHA_FERIADO no da turnos.
 * 
 * Ej. 2 — ¿Por qué fetch necesita un `if (!response.ok)` aparte del try/catch?
 *  Porque fetch solo rechaza la promesa ante errores de RED (sin conexión, DNS, timeout). Si el servidor
 *  contesta un 404 o un 500, la promesa se resuelve normalmente y el catch no se entera: hay que mirar el status.
 */

/**
 * Gateway (adaptador) de la API pública de feriados de ArgentinaDatos.
 * Contrato que cumplen todos los calendarios (también el fake):
 *   - getFeriado(fecha)          → { fecha, nombre, tipo } | null    (1 pedido HTTP: el año de esa fecha)
 *   - getFeriadosDeAnios(anios)  → { "AAAA-MM-DD": { fecha, nombre, tipo } }   (1 pedido por año)
 * Traduce el modelo externo al nuestro: lo de la API no se filtra hacia adentro de la aplicación.
 */
function createFeriadosGateway({ baseUrl, timeoutMs }) {
  // Modelo externo → modelo propio. Con ?? porque la API puede omitir campos.
  const toFeriado = (raw) => ({
    fecha: raw.fecha,
    nombre: raw.nombre ?? "Feriado",
    tipo: raw.tipo ?? null, // inamovible | trasladable | puente
  });

  // Un único pedido HTTP: todos los feriados de un año
  async function fetchAnio(anio) {
    let response;
    try {
      response = await fetch(`${baseUrl}/v1/feriados/${anio}`, {
        headers: { "User-Agent": "lavadero-api-grupo3/1.0 (ORT TP-2, clase 12)" },
        // Sin timeout, un servidor externo colgado deja colgado también nuestro request
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err) {
      if (err.name === "TimeoutError") {
        throw new AppError("EXTERNAL_TIMEOUT", "El calendario de feriados tardó demasiado en responder", 504);
      }
      throw new AppError("EXTERNAL_API_ERROR", "No se pudo conectar con el calendario de feriados", 502);
    }

    // Un 4xx o 5xx NO hace fallar a fetch: hay que revisarlo a mano
    if (!response.ok) {
      throw new AppError("EXTERNAL_API_ERROR", `El calendario de feriados respondió ${response.status}`, 502);
    }

    let data;
    try {
      data = await response.json();
    } catch {
      throw new AppError("EXTERNAL_API_ERROR", "El calendario de feriados devolvió una respuesta inválida", 502);
    }
    if (!Array.isArray(data)) {
      throw new AppError("EXTERNAL_API_ERROR", "El calendario de feriados devolvió un formato inesperado", 502);
    }
    return data.map(toFeriado);
  }

  return {
    async getFeriado(fecha) {
      const feriados = await fetchAnio(fecha.slice(0, 4));
      return feriados.find((f) => f.fecha === fecha) ?? null;
    },

    async getFeriadosDeAnios(anios) {
      // Un pedido por año distinto; los años son independientes y se piden en paralelo
      const unicos = [...new Set(anios.map(String))];
      const listas = await Promise.all(unicos.map((anio) => fetchAnio(anio)));
      return Object.fromEntries(listas.flat().map((f) => [f.fecha, f]));
    },
  };
}

export default createFeriadosGateway;