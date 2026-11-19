/**
 * Reloj inyectable (Clase 13).
 * La hora es un dato EXTERNO, igual que la base o una API: si un caso de uso llama a `new Date()`,
 * no se puede probar ("¿qué pasa con un turno de la semana pasada?" obligaría a esperar una semana).
 * Por eso los casos de uso reciben un `clock` y nunca llaman a `new Date()` por su cuenta.
 *
 *  - En producción: createClock() → hora real.
 *  - Para probar a mano: CLOCK_NOW=2026-12-01T12:00:00Z en el .env ("viajar en el tiempo").
 *  - En los tests (clase 14): createClock({ fixedNow: "..." }) → siempre el mismo instante.
 */

// Zona horaria del lavadero: define qué día y qué hora es "ahora". Una sola, fija, para todo el sistema.
const TIME_ZONE = "America/Argentina/Buenos_Aires";

// "en-CA" formatea la fecha como AAAA-MM-DD; hourCycle h23 evita el "24:00" de medianoche
const formatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

// Instante → "AAAA-MM-DDTHH:mm" en la hora del lavadero (el mismo formato con el que se guardan los turnos)
function toLocal(date) {
  const p = Object.fromEntries(formatter.formatToParts(date).map(({ type, value }) => [type, value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

export function createClock({ fixedNow } = {}) {
  if (fixedNow && Number.isNaN(new Date(fixedNow).getTime())) {
    throw new Error(`CLOCK_NOW no es una fecha válida: "${fixedNow}"`);
  }
  const now = () => (fixedNow ? new Date(fixedNow) : new Date());

  return {
    now, // instante (Date)
    ahora: () => toLocal(now()), // "AAAA-MM-DDTHH:mm" en Buenos Aires
    hoy: () => toLocal(now()).slice(0, 10), // "AAAA-MM-DD" en Buenos Aires (no en UTC)
  };
}

export { TIME_ZONE };