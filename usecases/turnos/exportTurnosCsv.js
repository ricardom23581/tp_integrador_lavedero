import AppError from "../../errors/AppError.js";
import { toCsv } from "../../utils/csv.js";

// Columnas propias de cada turno (cliente sale de nuestra base, no de afuera)
const COLUMNAS = [
  { header: "id", value: (t) => t.id },
  { header: "fecha", value: (t) => t.fecha.replace("T", " ") },
  { header: "patente", value: (t) => t.patente },
  { header: "tipo_vehiculo", value: (t) => t.tipoVehiculo },
  { header: "estado", value: (t) => t.estado },
  { header: "cliente", value: (t) => t.cliente?.nombre },
  { header: "email", value: (t) => t.cliente?.email },
];
// Columna que viene del calendario externo
const COLUMNAS_ENRIQUECIDAS = [{ header: "feriado", value: (t) => t.feriado?.nombre }];

/**
 * Caso de uso: exportar los turnos a CSV (para el admin).
 * Usa los mismos filtros que el listado a través de getTurnos (y por lo tanto las mismas reglas de acceso).
 * Con `enriquecer` agrega la columna "feriado" consultando el calendario AGRUPADO POR AÑO
 * (un pedido por año, no uno por turno). Si el calendario no responde, igual se exporta lo local
 * y se informa en `enrichment`.
 * Devuelve { csv, filename, enrichment: "skipped" | "ok" | "unavailable" }.
 */
async function exportTurnosCsv({ enriquecer, separador = ",", ...filtros }, actor, getTurnos, usuariosDao, calendario) {
  const { items: turnos } = await getTurnos(filtros, actor);

  // Nombre y email del cliente: una sola lectura de usuarios para todo el archivo
  const usuarios = await usuariosDao.getAll();
  const clientePorId = Object.fromEntries(usuarios.map((u) => [u.id, u]));

  let feriadoPorFecha = {};
  let enrichment = "skipped";
  if (enriquecer) {
    const anios = [...new Set(turnos.map((t) => t.fecha.slice(0, 4)))];
    try {
      feriadoPorFecha = anios.length > 0 ? await calendario.getFeriadosDeAnios(anios) : {};
      enrichment = "ok";
    } catch (err) {
      if (!(err instanceof AppError)) throw err;
      enrichment = "unavailable";
    }
  }

  const filas = turnos.map((t) => ({
    ...t,
    cliente: clientePorId[t.clienteId],
    feriado: feriadoPorFecha[t.fecha.slice(0, 10)],
  }));
  const columnas = enriquecer ? [...COLUMNAS, ...COLUMNAS_ENRIQUECIDAS] : COLUMNAS;

  return {
    csv: toCsv(filas, columnas, { separator: separador }),
    filename: `turnos-${new Date().toISOString().slice(0, 10)}.csv`,
    enrichment,
  };
}

export default exportTurnosCsv;