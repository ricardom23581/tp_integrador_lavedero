import { describe, it, expect } from "vitest";
import { esDiaHabil, sumarDiasHabiles, sumarDiasCorridos, diasEntre } from "../../domain/diasHabiles.js";

/**
 * Funciones PURAS: sin base, sin reloj, sin red. Son las más fáciles de testear y por eso van primero.
 * R2 del lavadero: un turno se puede sacar con hasta N días hábiles de anticipación.
 */
describe("sumarDiasHabiles", () => {
  it.each([
    // [descripción, desde, días, feriados, esperado]
    ["miércoles + 10 hábiles", "2026-11-04", 10, [], "2026-11-18"],
    ["miércoles + 10 con un feriado en el medio", "2026-11-04", 10, ["2026-11-09"], "2026-11-19"],
    ["de viernes a lunes", "2026-11-06", 1, [], "2026-11-09"],
    ["empezando un sábado", "2026-11-07", 1, [], "2026-11-09"],
    ["empezando un domingo", "2026-11-08", 1, [], "2026-11-09"],
    ["fin de semana largo (feriado del lunes 23)", "2026-11-20", 1, ["2026-11-23"], "2026-11-24"],
    ["0 días no mueve la fecha", "2026-11-04", 0, [], "2026-11-04"],
    ["cruzando el fin de año", "2026-12-20", 10, ["2026-12-25", "2027-01-01"], "2027-01-05"],
    ["cruzando un 29 de febrero", "2028-02-25", 3, [], "2028-03-01"],
    ["un feriado en fin de semana no resta nada", "2026-11-04", 5, ["2026-11-07"], "2026-11-11"],
  ])("%s: %s + %i → %s", (_, desde, dias, feriados, esperado) => {
    expect(sumarDiasHabiles(desde, dias, feriados)).toBe(esperado);
  });

  it("los feriados son opcionales", () => {
    expect(sumarDiasHabiles("2026-11-04", 1)).toBe("2026-11-05");
  });
});

describe("esDiaHabil", () => {
  // Recibe un Set (lo arma sumarDiasHabiles para buscar rápido)
  it.each([
    ["2026-11-04", new Set(), true], // miércoles
    ["2026-11-07", new Set(), false], // sábado
    ["2026-11-08", new Set(), false], // domingo
    ["2026-11-23", new Set(["2026-11-23"]), false], // lunes feriado
  ])("%s → %s", (dia, feriados, esperado) => {
    expect(esDiaHabil(dia, feriados)).toBe(esperado);
  });
});

describe("sumarDiasCorridos y diasEntre", () => {
  it("sumarDiasCorridos cuenta sábados y domingos, y cruza meses", () => {
    expect(sumarDiasCorridos("2026-11-28", 5)).toBe("2026-12-03");
  });

  it("diasEntre cuenta días corridos", () => {
    expect(diasEntre("2026-11-04", "2026-11-18")).toBe(14);
  });

  it("diasEntre puede dar negativo si 'hasta' es anterior", () => {
    expect(diasEntre("2026-11-18", "2026-11-04")).toBe(-14);
  });
});