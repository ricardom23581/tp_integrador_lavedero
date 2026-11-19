/**
 * Horario de atención del lavadero (Clase 13, regla R5).
 * Abre de 08:00 a 17:00 y los turnos empiezan cada 15 minutos: el último turno es a las 16:45.
 * Es una validación de FORMA: se decide mirando solo el dato ("2026-11-24T10:15"), sin consultar nada.
 * Supone que ya se validó el formato AAAA-MM-DDTHH:mm (por eso en el esquema va DESPUÉS del regex).
 */
export const HORA_APERTURA = 8;
export const HORA_CIERRE = 17;
export const MINUTOS_POR_TURNO = 15;

export function esHorarioDeAtencion(fechaHora) {
  const hora = Number(fechaHora.slice(11, 13));
  const minutos = Number(fechaHora.slice(14, 16));
  return hora >= HORA_APERTURA && hora < HORA_CIERRE && minutos % MINUTOS_POR_TURNO === 0;
}