// scripts/diasHabilesDemo.js — Ejercicio 3.5 (Clase 13): node scripts/diasHabilesDemo.js
// Todo lo de acá es PURO: no hay base, ni red, ni new Date() "de verdad". Por eso los resultados son siempre los mismos.
import { sumarDiasHabiles } from "../domain/diasHabiles.js";
import { estaAusente, conSituacion } from "../domain/situacionTurno.js";
import { createClock } from "../utils/clock.js";
import { esHorarioDeAtencion } from "../utils/horario.js";

const feriados = ["2026-11-09", "2026-11-23", "2026-12-07", "2026-12-08", "2026-12-25", "2027-01-01"];

console.log("== R2: días hábiles ==");
console.log("Desde el miércoles 2026-11-04, 10 hábiles sin feriados:", sumarDiasHabiles("2026-11-04", 10, []), "(esperado 2026-11-18)");
console.log("Desde el miércoles 2026-11-04, 10 hábiles con feriados:", sumarDiasHabiles("2026-11-04", 10, feriados), "(esperado 2026-11-19)");
console.log("Desde un viernes (2026-11-06), 1 día hábil:", sumarDiasHabiles("2026-11-06", 1, feriados), "(esperado 2026-11-10: salta el finde y el 9)");
console.log("Cruzando el fin de año (2026-12-20), 10 hábiles:", sumarDiasHabiles("2026-12-20", 10, feriados), "(esperado 2027-01-05)");

console.log("\n== R3: ausente es una situación calculada ==");
const turno = { id: 1, fecha: "2026-11-18T10:00", estado: "Esperando el servicio" };
for (const hoy of ["2026-11-17", "2026-11-18", "2026-11-19"]) {
  const { situacion, diasAusente } = conSituacion(turno, hoy);
  console.log(`Hoy ${hoy}: estaAusente=${estaAusente(turno, hoy)} situacion=${situacion} diasAusente=${diasAusente}`);
}
console.log("(el MISMO día del turno todavía NO está ausente: el cliente puede llegar más tarde)");
const finalizado = { ...turno, estado: "Lavado finalizado" };
console.log("Un turno finalizado nunca está ausente:", conSituacion(finalizado, "2026-11-30").situacion);

console.log("\n== El reloj inyectado ==");
// 2026-11-05T02:30Z es el 4/11 a las 23:30 en Buenos Aires: en UTC ya es "mañana"
const clock = createClock({ fixedNow: "2026-11-05T02:30:00Z" });
console.log("Instante:", clock.now().toISOString(), "→ hoy en el lavadero:", clock.hoy(), "/ ahora:", clock.ahora(), "(no 2026-11-05)");

console.log("\n== R5: horario de atención (08:00 a 16:45, cada 15 minutos) ==");
for (const fecha of ["2026-11-24T08:00", "2026-11-24T16:45", "2026-11-24T17:00", "2026-11-24T07:45", "2026-11-24T10:10"]) {
  console.log(fecha, esHorarioDeAtencion(fecha) ? "válido" : "INVÁLIDO");
}