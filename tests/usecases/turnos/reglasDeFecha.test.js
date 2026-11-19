import { describe, it, expect, vi } from "vitest";
import { validarFechaFutura, validarCalendario } from "../../../usecases/turnos/reglasDeFecha.js";
import AppError from "../../../errors/AppError.js";

/**
 * validarCalendario con un STUB del calendario armado con vi.fn(): no hay red ni demora,
 * y cada test decide qué responde el "tercero" (feriados, un AppError o un bug).
 */
const FERIADOS = {
  "2026-12-25": { fecha: "2026-12-25", nombre: "Navidad" },
  "2027-01-01": { fecha: "2027-01-01", nombre: "Año nuevo" },
};
// Devuelve solo los feriados de los años pedidos (como el real)
const stubCalendario = () => ({
  getFeriadosDeAnios: vi.fn(async (anios) =>
    Object.fromEntries(Object.entries(FERIADOS).filter(([fecha]) => anios.map(String).includes(fecha.slice(0, 4))))
  ),
});

describe("validarFechaFutura", () => {
  it.each([
    ["2026-11-04T12:15", true],
    ["2026-11-04T12:00", false], // borde: "ahora" ya no es futuro
    ["2026-11-03T16:45", false],
  ])("%s con ahora = 2026-11-04T12:00 → válida: %s", (fecha, valida) => {
    const validar = () => validarFechaFutura(fecha, "2026-11-04T12:00");
    if (valida) expect(validar).not.toThrow();
    else expect(validar).toThrow(expect.objectContaining({ code: "FECHA_PASADA", statusCode: 422 }));
  });
});

describe("validarCalendario", () => {
  it("un plazo que cruza el fin de año pide los DOS años, en un solo llamado", async () => {
    const calendario = stubCalendario();

    const { fechaLimite } = await validarCalendario({ fecha: "2026-12-28T10:00", hoy: "2026-12-20", diasHabiles: 10, calendario });

    expect(calendario.getFeriadosDeAnios).toHaveBeenCalledOnce();
    expect(calendario.getFeriadosDeAnios).toHaveBeenCalledWith([2026, 2027]);
    expect(fechaLimite).toBe("2027-01-05"); // saltea el 25/12 y el 1/1
  });

  it("a principios de año se pide un solo año", async () => {
    const calendario = stubCalendario();

    await validarCalendario({ fecha: "2026-03-05T10:00", hoy: "2026-03-02", diasHabiles: 10, calendario });

    expect(calendario.getFeriadosDeAnios).toHaveBeenCalledWith([2026]);
  });

  it("un AppError del calendario DEGRADA: límite solo con fines de semana y feriadosDisponibles: false", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const calendario = { getFeriadosDeAnios: vi.fn().mockRejectedValue(new AppError("EXTERNAL_TIMEOUT", "tardó", 504)) };

    const resultado = await validarCalendario({ fecha: "2026-12-28T10:00", hoy: "2026-12-20", diasHabiles: 10, calendario });

    expect(resultado).toEqual({ fechaLimite: "2027-01-01", feriadosDisponibles: false });
  });

  it("un error que NO es AppError (un bug nuestro) se propaga", async () => {
    const calendario = { getFeriadosDeAnios: vi.fn().mockRejectedValue(new ReferenceError("feriado is not defined")) };

    await expect(
      validarCalendario({ fecha: "2026-11-10T10:00", hoy: "2026-11-04", diasHabiles: 10, calendario })
    ).rejects.toThrow(ReferenceError);
  });
});