/**
 * Calendario de días hábiles (Clase 13, regla R2).
 * Funciones PURAS: reciben datos y devuelven un resultado, sin leer la base, ni la hora, ni la red.
 * Por eso se entienden y se testean sin infraestructura (clase 14).
 *
 * Las fechas son texto "AAAA-MM-DD" (días, no instantes): así no hay problemas de zona horaria.
 * Internamente se usa UTC solo como "calendario neutro" para sumar días.
 */

const toIso = (date) => date.toISOString().slice(0, 10);

// ¿Es hábil? No es sábado (6), ni domingo (0), ni feriado
export function esDiaHabil(dia, feriados) {
  const diaSemana = new Date(`${dia}T00:00:00Z`).getUTCDay();
  return diaSemana !== 0 && diaSemana !== 6 && !feriados.has(dia);
}

// Suma `dias` días hábiles a partir de `desde` (el día de inicio no cuenta)
export function sumarDiasHabiles(desde, dias, feriados = []) {
  const feriadosSet = new Set(feriados); // búsqueda rápida
  const fecha = new Date(`${desde}T00:00:00Z`);
  let faltan = dias;

  while (faltan > 0) {
    fecha.setUTCDate(fecha.getUTCDate() + 1); // avanzamos un día
    if (esDiaHabil(toIso(fecha), feriadosSet)) faltan--; // solo cuenta si es hábil
  }
  return toIso(fecha);
}

// Suma días CORRIDOS (sirve, por ejemplo, para saber qué años de feriados hay que pedir)
export function sumarDiasCorridos(desde, dias) {
  const fecha = new Date(`${desde}T00:00:00Z`);
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  return toIso(fecha);
}

// Diferencia en días corridos entre dos fechas AAAA-MM-DD (hasta - desde)
export function diasEntre(desde, hasta) {
  return Math.round((Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) / 86_400_000);
}