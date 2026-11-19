import { describe, it, expect } from "vitest";
import { estaAusente, situacionDe, conSituacion, ESTADO_PENDIENTE } from "../../domain/situacionTurno.js";

/**
 * R3: "ausente" se CALCULA (pendiente y con el día ya pasado), no se guarda.
 * Hoy, en todos los tests, es el miércoles 2026-11-04.
 */
const HOY = "2026-11-04";
const turno = (fecha, estado = ESTADO_PENDIENTE) => ({ id: 1, patente: "AB123CD", fecha, estado });

describe("estaAusente", () => {
  it("un turno futuro no está ausente", () => {
    expect(estaAusente(turno("2026-11-05T10:00"), HOY)).toBe(false);
  });

  it("borde: el MISMO día del turno todavía no está ausente (puede llegar más tarde)", () => {
    expect(estaAusente(turno("2026-11-04T08:00"), HOY)).toBe(false);
  });

  it("al día siguiente del turno, si sigue esperando, está ausente", () => {
    expect(estaAusente(turno("2026-11-03T16:45"), HOY)).toBe(true);
  });

  it("un turno ya atendido (aunque sea de días atrás) nunca está ausente", () => {
    expect(estaAusente(turno("2026-10-20T10:00", "Lavado finalizado"), HOY)).toBe(false);
  });
});

describe("situacionDe", () => {
  it.each([
    ["2026-11-10T10:00", ESTADO_PENDIENTE, "pendiente"],
    ["2026-11-01T10:00", ESTADO_PENDIENTE, "ausente"],
    ["2026-11-04T10:00", "En proceso de lavado", "en proceso"],
    ["2026-11-01T10:00", "Lavado finalizado", "finalizado"],
  ])("%s, %s → %s", (fecha, estado, esperado) => {
    expect(situacionDe(turno(fecha, estado), HOY)).toBe(esperado);
  });
});

describe("conSituacion", () => {
  it("agrega situacion y diasAusente SIN modificar el objeto original", () => {
    const original = turno("2026-10-30T09:00");

    const resultado = conSituacion(original, HOY);

    expect(resultado).toMatchObject({ situacion: "ausente", diasAusente: 5 });
    expect(original).not.toHaveProperty("situacion"); // el original quedó igual
    expect(resultado).not.toBe(original); // es un objeto nuevo
  });

  it("un turno pendiente a futuro tiene diasAusente 0", () => {
    expect(conSituacion(turno("2026-11-10T10:00"), HOY)).toMatchObject({ situacion: "pendiente", diasAusente: 0 });
  });

  it("con null devuelve null (por ejemplo, un getById que no encontró nada)", () => {
    expect(conSituacion(null, HOY)).toBeNull();
  });
});