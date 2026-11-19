import AppError from "../../errors/AppError.js";
import { conSituacion } from "../../domain/situacionTurno.js";

/**
 * Caso de uso: obtener un turno por id.
 * Devuelve el turno (con su situación calculada) o null si no existe (el controller decide el 404).
 * Regla de acceso: un cliente (rol "user") solo puede ver sus propios turnos; el admin ve todos.
 *
 * Ejercicio 9.3 — Si un cliente pide GET /api/turnos/5 y es de otra persona: ¿403 o 404? Decisión: 403.
 *  - Los ids son correlativos: saber que "existe el turno 5" no revela nada (cualquiera lo deduce).
 *    Lo privado es el CONTENIDO (de quién es, qué patente, a qué hora), y el 403 no lo muestra.
 *  - Es coherente con reprogramar (T15 responde 403) y con el orden que usamos en toda la API:
 *    existencia (404) → permiso (403) → estado (409). Un 404 "mentiroso" acá rompería esa regla.
 *  - Al front le sirve: 403 dice "existe, pero no es tuyo"; un 404 lo haría pensar que se borró.
 * Cuándo convendría 404: si los ids fueran adivinables Y su sola existencia fuera sensible, para no
 * permitir enumerar recursos ajenos. No es nuestro caso.
 */
async function getTurnoById(id, actor, { turnosDao, clock }) {
  const turno = await turnosDao.getById(id);
  if (turno && actor.rol !== "admin" && turno.clienteId !== actor.id) {
    throw new AppError("PROHIBIDO", "No tenés permiso para ver este turno", 403);
  }
  return conSituacion(turno, clock.hoy());
}

export default getTurnoById;