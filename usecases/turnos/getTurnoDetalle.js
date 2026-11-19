import AppError from "../../errors/AppError.js";
import getTurnoById from "./getTurnoById.js";

/*
 * Reflexión: ¿por qué el catch verifica `instanceof AppError` y no atrapa cualquier error?
 * Los AppError del gateway son fallas ESPERABLES de un tercero (timeout, 5xx, sin red) y tienen una salida
 * prevista: degradar. Cualquier otro error (un TypeError por un bug nuestro) es inesperado: si lo tragáramos,
 * el endpoint respondería "unavailable" y el bug quedaría escondido en lugar de verse en los logs.
 */

/**
 * Caso de uso: detalle de un turno + si su día es feriado (consultando el calendario externo).
 * Reutiliza getTurnoById, así se respetan las mismas reglas de acceso (un cliente solo ve lo suyo).
 * Devuelve el turno con { feriado, calendarioStatus } o null si no existe.
 *   calendarioStatus: "feriado" | "habil" | "unavailable"
 * Regla: el calendario es un EXTRA. Si no responde, el turno igual se devuelve (degradación elegante).
 */
async function getTurnoDetalle(id, actor, dao, calendario) {
  const turno = await getTurnoById(id, actor, dao);
  if (!turno) return null;

  try {
    const feriado = await calendario.getFeriado(turno.fecha.slice(0, 10));
    return { ...turno, feriado, calendarioStatus: feriado ? "feriado" : "habil" };
  } catch (err) {
    // Solo se absorben los errores del calendario (AppError). Un bug nuestro tiene que seguir explotando.
    if (!(err instanceof AppError)) throw err;
    return { ...turno, feriado: null, calendarioStatus: "unavailable" };
  }
}

export default getTurnoDetalle;