import { describe, it, expect } from "vitest";
import { esHorarioDeAtencion } from "../../utils/horario.js";

/**
 * R5: el lavadero atiende de 08:00 a 17:00, con turnos cada 15 minutos (el último a las 16:45).
 * Los bordes son lo que más importa: apertura, último turno y cierre.
 *
 * ¿Qué implementación incorrecta pasa todos los casos MENOS uno? `hora <= HORA_CIERRE` en lugar de `<`:
 * sigue aceptando 08:00, 12:30 y 16:45, pero también daría turno a las 17:00, con el lavadero cerrando.
 * Solo el test del borde (17:00) la detecta: por eso los bordes no son opcionales.
 */
describe("esHorarioDeAtencion", () => {
  it.each([
    ["2026-11-04T08:00", true], // borde: apertura
    ["2026-11-04T07:45", false], // antes de abrir
    ["2026-11-04T12:30", true],
    ["2026-11-04T16:45", true], // borde: último turno
    ["2026-11-04T17:00", false], // borde: hora de cierre (ya no hay turno)
    ["2026-11-04T10:10", false], // no cae en un múltiplo de 15
    ["2026-11-04T00:00", false],
  ])("%s → %s", (fechaHora, esperado) => {
    expect(esHorarioDeAtencion(fechaHora)).toBe(esperado);
  });
});