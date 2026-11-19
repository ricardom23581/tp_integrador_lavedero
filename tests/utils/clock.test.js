import { describe, it, expect } from "vitest";
import { createClock } from "../../utils/clock.js";

describe("createClock", () => {
  it("con fixedNow, now() devuelve siempre ese instante", () => {
    const clock = createClock({ fixedNow: "2026-11-04T12:00:00-03:00" });

    expect(clock.now()).toEqual(new Date("2026-11-04T15:00:00Z"));
    expect(clock.now()).toEqual(clock.now());
  });

  it("hoy() y ahora() usan la hora del LAVADERO (Buenos Aires), no la de UTC", () => {
    // 02:30 en UTC del jueves 5 = 23:30 del miércoles 4 en Buenos Aires
    const clock = createClock({ fixedNow: "2026-11-05T02:30:00Z" });

    expect(clock.hoy()).toBe("2026-11-04");
    expect(clock.ahora()).toBe("2026-11-04T23:30");
  });

  it("ahora() tiene el mismo formato que la fecha de los turnos (AAAA-MM-DDTHH:mm)", () => {
    const clock = createClock({ fixedNow: "2026-11-04T09:05:00-03:00" });

    expect(clock.ahora()).toBe("2026-11-04T09:05");
  });

  it("un fixedNow inválido lanza un error AL CREAR el reloj", () => {
    // La flecha hace que expect llame a la función ADENTRO de un try/catch. Sin ella, createClock(...) se
    // ejecutaría antes de llegar a expect, el error cortaría el test y toThrow nunca podría atraparlo.
    expect(() => createClock({ fixedNow: "mañana" })).toThrow('CLOCK_NOW no es una fecha válida: "mañana"');
  });

  it("sin fixedNow usa la hora real", () => {
    const antes = Date.now();
    const ahora = createClock().now().getTime();

    expect(ahora).toBeGreaterThanOrEqual(antes);
  });
});