import { diasEntre } from "./diasHabiles.js";

/**
 * Situación de un turno (Clase 13, regla R3).
 * "Ausente" es un estado CALCULADO, no guardado: depende de qué día es hoy.
 * Un turno está ausente si sigue "Esperando el servicio" y su día YA PASÓ (el cliente no vino).
 * El mismo día del turno todavía NO está ausente: puede llegar más tarde.
 *
 * Se guardan los HECHOS (fecha, estado, reprogramaciones); se DERIVAN las conclusiones (situacion, diasAusente).
 *
 * ¿Por qué no guardamos un estado "Ausente"? Porque nadie "marca" la ausencia: pasa el tiempo.
 * Haría falta un proceso nocturno que actualice la columna, y si ese proceso falla un día, la base miente.
 * Calculado, siempre es correcto, y con un reloj fijo se puede probar cualquier fecha.
 */

export const ESTADO_PENDIENTE = "Esperando el servicio";

const SITUACION_POR_ESTADO = {
  "En proceso de lavado": "en proceso",
  "Lavado finalizado": "finalizado",
};

// Un turno está ausente si sigue esperando y su día es anterior a hoy
export const estaAusente = (turno, hoy) => turno.estado === ESTADO_PENDIENTE && turno.fecha.slice(0, 10) < hoy;

export function situacionDe(turno, hoy) {
  if (turno.estado !== ESTADO_PENDIENTE) return SITUACION_POR_ESTADO[turno.estado] ?? turno.estado;
  return estaAusente(turno, hoy) ? "ausente" : "pendiente";
}

// Agrega los campos calculados a la respuesta (no se persisten)
export function conSituacion(turno, hoy) {
  if (!turno) return turno;
  return {
    ...turno,
    situacion: situacionDe(turno, hoy),
    diasAusente: estaAusente(turno, hoy) ? diasEntre(turno.fecha.slice(0, 10), hoy) : 0,
  };
}