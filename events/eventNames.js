/**
 * Nombres de los eventos de dominio de la app.
 * Formato: "entidad.accion" en pasado (el evento anuncia algo que YA pasó).
 * Los casos de uso emiten estos nombres y los listeners los escuchan:
 * ambos importan de acá, así nunca se desincronizan.
 */
export const EVENTS = Object.freeze({
  TURNO_CREADO: "turno.creado",
  TURNO_FINALIZADO: "turno.finalizado",
});