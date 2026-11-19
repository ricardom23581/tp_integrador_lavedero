import { describe, it, expect, vi } from "vitest";
import createFeriadosGateway from "../../gateways/feriadosGateway.js";

/**
 * Clase 14 - Ejercicio 7: el gateway REAL de ArgentinaDatos, probado SIN internet.
 *
 * 7.1 — Antes del refactor, el gateway llamaba al fetch GLOBAL. Un test así:
 *     const gateway = createFeriadosGateway({ baseUrl: "https://api.argentinadatos.com", timeoutMs: 5000 });
 *     await expect(gateway.getFeriadosDeAnios([2026])).rejects.toMatchObject({ code: "EXTERNAL_API_ERROR" });
 *   no se podía escribir: salía de verdad a internet (cientos de ms), sin red fallaba con otro error, y la API
 *   real casi nunca responde 500, así que "¿qué pasa si responde 500?" no había forma de forzarlo.
 * 7.2 — ¿Qué tenía que ver probar la traducción de errores con internet? Nada: el gateway estaba ACOPLADO a una
 *   dependencia global (fetch). Es el mismo problema que createBook con config.js en la biblioteca.
 * 7.6 — Se podría haber "arreglado" con vi.stubGlobal("fetch", ...) o vi.spyOn(globalThis, "fetch"). Es peor:
 *   tapa el síntoma y deja el acoplamiento. Reemplaza fetch para TODO el proceso (cualquier otro código que lo use
 *   en ese test también recibe la respuesta falsa), hay que acordarse de restaurarlo, y el diseño sigue igual:
 *   el gateway decide solo de dónde saca su dependencia. Inyectándolo, el test pasa el fetch que quiere y punto.
 */

// Arma un fetch falso que responde con `status` y `body` (o lanza `error`), y registra con qué se lo llamó
const fakeFetch = ({ status = 200, body = [], error, jsonInvalido = false } = {}) =>
  vi.fn(async () => {
    if (error) throw error;
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => {
        if (jsonInvalido) throw new SyntaxError("Unexpected token < in JSON");
        return body;
      },
    };
  });

const crear = (fetchFn) => createFeriadosGateway({ baseUrl: "https://api.test", timeoutMs: 1000, fetchFn });

const FERIADOS_2026 = [
  { fecha: "2026-11-23", tipo: "trasladable", nombre: "Día de la Soberanía Nacional" },
  { fecha: "2026-12-25", tipo: "inamovible", nombre: "Navidad" },
  { fecha: "2026-12-07", tipo: "puente" }, // sin nombre: la API puede omitir campos
];

describe("feriadosGateway (ArgentinaDatos) con fetch inyectado", () => {
  it("pide el año a la URL correcta, con User-Agent y con timeout", async () => {
    const fetchFn = fakeFetch({ body: FERIADOS_2026 });

    await crear(fetchFn).getFeriadosDeAnios([2026]);

    expect(fetchFn).toHaveBeenCalledWith(
      "https://api.test/v1/feriados/2026",
      expect.objectContaining({ headers: expect.objectContaining({ "User-Agent": expect.any(String) }), signal: expect.any(AbortSignal) })
    );
  });

  it("traduce el modelo externo al propio: indexa por fecha y completa los campos que faltan", async () => {
    const feriados = await crear(fakeFetch({ body: FERIADOS_2026 })).getFeriadosDeAnios([2026]);

    expect(feriados["2026-12-25"]).toEqual({ fecha: "2026-12-25", nombre: "Navidad", tipo: "inamovible" });
    expect(feriados["2026-12-07"]).toEqual({ fecha: "2026-12-07", nombre: "Feriado", tipo: "puente" });
  });

  it("getFeriado devuelve el feriado de ese día, o null si es hábil", async () => {
    const gateway = crear(fakeFetch({ body: FERIADOS_2026 }));

    expect(await gateway.getFeriado("2026-11-23")).toMatchObject({ nombre: "Día de la Soberanía Nacional" });
    expect(await gateway.getFeriado("2026-11-24")).toBeNull();
  });

  it("varios años → un pedido por año DISTINTO", async () => {
    const fetchFn = fakeFetch({ body: [] });

    await crear(fetchFn).getFeriadosDeAnios([2026, 2027, 2026]);

    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it.each([
    ["la API responde 500", { status: 500 }, "EXTERNAL_API_ERROR", 502, "respondió 500"],
    ["la API responde 404", { status: 404 }, "EXTERNAL_API_ERROR", 502, "respondió 404"],
    ["no hay conexión", { error: new TypeError("fetch failed") }, "EXTERNAL_API_ERROR", 502, "No se pudo conectar"],
    ["tarda más que el timeout", { error: Object.assign(new Error("aborted"), { name: "TimeoutError" }) }, "EXTERNAL_TIMEOUT", 504, "tardó"],
    ["devuelve JSON inválido (ej. una página HTML)", { jsonInvalido: true }, "EXTERNAL_API_ERROR", 502, "respuesta inválida"],
    ["devuelve algo que no es un arreglo", { body: { error: "x" } }, "EXTERNAL_API_ERROR", 502, "formato inesperado"],
  ])("%s → AppError %s (%i)", async (_, respuesta, code, statusCode, mensaje) => {
    await expect(crear(fakeFetch(respuesta)).getFeriadosDeAnios([2026])).rejects.toMatchObject({
      name: "AppError", // un AppError: las reglas de turnos lo saben DEGRADAR (no es un bug)
      code,
      statusCode,
      message: expect.stringContaining(mensaje),
    });
  });
});