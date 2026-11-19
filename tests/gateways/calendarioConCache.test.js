import { describe, it, expect, vi } from "vitest";
import { conCachePorAnio } from "../../gateways/calendarioConCache.js";
import AppError from "../../errors/AppError.js";

/**
 * El decorador de caché, con un SPY sobre el calendario de abajo: lo que importa no es solo QUÉ devuelve,
 * sino CUÁNTOS pedidos llegan al tercero (cada pedido real a ArgentinaDatos cuesta tiempo).
 */
const feriadosDe = (anio) => ({ [`${anio}-12-25`]: { fecha: `${anio}-12-25`, nombre: "Navidad" } });
const calendarioBase = () => ({
  getFeriadosDeAnios: vi.fn(async ([anio]) => feriadosDe(anio)),
});

describe("conCachePorAnio", () => {
  it("dos consultas del mismo año → UN solo pedido al calendario de abajo", async () => {
    const base = calendarioBase();
    const calendario = conCachePorAnio(base);

    await calendario.getFeriadosDeAnios([2026]);
    const segunda = await calendario.getFeriadosDeAnios([2026]);

    expect(base.getFeriadosDeAnios).toHaveBeenCalledOnce();
    expect(segunda).toEqual(feriadosDe(2026));
  });

  it("dos consultas SIMULTÁNEAS comparten el mismo pedido (se guarda la promesa, no el resultado)", async () => {
    const base = calendarioBase();
    const calendario = conCachePorAnio(base);

    await Promise.all([calendario.getFeriadosDeAnios([2026]), calendario.getFeriado("2026-12-25")]);

    expect(base.getFeriadosDeAnios).toHaveBeenCalledOnce();
  });

  it("cada año se pide una vez, y el resultado junta los años", async () => {
    const base = calendarioBase();
    const calendario = conCachePorAnio(base);

    const feriados = await calendario.getFeriadosDeAnios([2026, 2027, 2026]);

    expect(base.getFeriadosDeAnios).toHaveBeenCalledTimes(2);
    expect(Object.keys(feriados)).toEqual(["2026-12-25", "2027-12-25"]);
  });

  it("una FALLA no queda guardada: la próxima consulta vuelve a intentar", async () => {
    const base = calendarioBase();
    base.getFeriadosDeAnios.mockRejectedValueOnce(new AppError("EXTERNAL_API_ERROR", "500", 502)); // solo la 1ª falla
    const calendario = conCachePorAnio(base);

    await expect(calendario.getFeriadosDeAnios([2026])).rejects.toMatchObject({ code: "EXTERNAL_API_ERROR" });
    await expect(calendario.getFeriadosDeAnios([2026])).resolves.toEqual(feriadosDe(2026));
    expect(base.getFeriadosDeAnios).toHaveBeenCalledTimes(2);
  });

  it("getFeriado devuelve null si ese día no es feriado", async () => {
    const calendario = conCachePorAnio(calendarioBase());

    expect(await calendario.getFeriado("2026-11-10")).toBeNull();
  });
});