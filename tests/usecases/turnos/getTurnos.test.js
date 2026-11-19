import { describe, it, expect, vi } from "vitest";
import { buildTurnoScenario, JUAN, MARIA, ADMIN } from "../../helpers/turnoScenario.js";

/**
 * Clase 14 - Ejercicio 10.1: getTurnos y getTurnoById estaban en 0% de cobertura.
 * Reglas que cuidan: el cliente solo ve lo suyo (403 si pide lo de otro), el admin ve todo,
 * `hasta` es INCLUSIVE, `ausentes=true` usa el "hoy" del reloj, y el orden y la paginación.
 * Hoy (reloj fijo) es el miércoles 2026-11-04.
 */
const PAGINA = { page: 1, limit: 20 }; // en la app los pone Zod por defecto

async function escenarioConTurnos() {
  const scenario = buildTurnoScenario();
  const { givenTurno } = scenario;
  await givenTurno({ clienteId: JUAN.id, patente: "AAA111", fecha: "2026-11-02T09:00" }); // ausente
  await givenTurno({ clienteId: JUAN.id, patente: "BBB222", fecha: "2026-11-10T10:00", tipoVehiculo: "moto" });
  await givenTurno({ clienteId: JUAN.id, patente: "CCC333", fecha: "2026-11-03T11:00", estado: "Lavado finalizado" });
  await givenTurno({ clienteId: MARIA.id, patente: "DDD444", fecha: "2026-11-06T15:00" });
  return scenario;
}

describe("getTurnos", () => {
  it("un cliente sin filtros ve SOLO sus turnos, cada uno con su situación", async () => {
    const { useCases } = await escenarioConTurnos();

    const { items, total } = await useCases.getTurnos({ ...PAGINA }, JUAN);

    expect(total).toBe(3);
    expect(items.every((t) => t.clienteId === JUAN.id)).toBe(true);
    expect(items.map((t) => t.situacion).sort()).toEqual(["ausente", "finalizado", "pendiente"]);
  });

  it("un cliente que pide los turnos de otro → 403 PROHIBIDO", async () => {
    const { useCases } = await escenarioConTurnos();

    await expect(useCases.getTurnos({ ...PAGINA, clienteId: MARIA.id }, JUAN)).rejects.toMatchObject({
      code: "PROHIBIDO",
      statusCode: 403,
    });
  });

  it("el admin ve todos, y puede filtrar por cualquier cliente", async () => {
    const { useCases } = await escenarioConTurnos();

    expect((await useCases.getTurnos({ ...PAGINA }, ADMIN)).total).toBe(4);
    expect((await useCases.getTurnos({ ...PAGINA, clienteId: MARIA.id }, ADMIN)).total).toBe(1);
  });

  it("desde/hasta son días y `hasta` es INCLUSIVE: se traduce a 'antes del día siguiente'", async () => {
    const { useCases, turnosDao } = await escenarioConTurnos();
    const spy = vi.spyOn(turnosDao, "getAll");

    const { items } = await useCases.getTurnos({ ...PAGINA, desde: "2026-11-03", hasta: "2026-11-06" }, ADMIN);

    expect(items.map((t) => t.patente).sort()).toEqual(["CCC333", "DDD444"]); // el del 06 a las 15:00 entra
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ desde: "2026-11-03", hastaAntesDe: "2026-11-07" }));
  });

  it("ausentes=true trae solo los pendientes de días anteriores a HOY (el del reloj)", async () => {
    const { useCases } = await escenarioConTurnos();

    const { items } = await useCases.getTurnos({ ...PAGINA, ausentes: true }, ADMIN);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ patente: "AAA111", situacion: "ausente", diasAusente: 2 });
  });

  it.each([
    ["tipoVehiculo", { tipoVehiculo: "moto" }, ["BBB222"]],
    ["fecha (un día)", { fecha: "2026-11-06" }, ["DDD444"]],
    ["patente", { patente: "CCC333" }, ["CCC333"]],
    ["estado", { estado: "Lavado finalizado" }, ["CCC333"]],
  ])("filtra por %s", async (_, filtro, patentes) => {
    const { useCases } = await escenarioConTurnos();

    const { items } = await useCases.getTurnos({ ...PAGINA, ...filtro }, ADMIN);

    expect(items.map((t) => t.patente)).toEqual(patentes);
  });

  it.each([
    ["fecha", ["AAA111", "CCC333", "DDD444", "BBB222"]],
    ["-fecha", ["BBB222", "DDD444", "CCC333", "AAA111"]],
  ])("ordena con sort=%s", async (sort, patentes) => {
    const { useCases } = await escenarioConTurnos();

    const { items } = await useCases.getTurnos({ ...PAGINA, sort }, ADMIN);

    expect(items.map((t) => t.patente)).toEqual(patentes);
  });

  it("pagina: total es la cantidad ANTES de paginar (para X-Total-Count)", async () => {
    const { useCases } = await escenarioConTurnos();

    const { items, total } = await useCases.getTurnos({ page: 2, limit: 3, sort: "fecha" }, ADMIN);

    expect(total).toBe(4);
    expect(items.map((t) => t.patente)).toEqual(["BBB222"]);
  });
});

describe("getTurnoById", () => {
  it("el dueño ve su turno, con la situación calculada", async () => {
    const { useCases, givenTurno } = buildTurnoScenario();
    const turno = await givenTurno({ clienteId: JUAN.id, fecha: "2026-11-02T09:00" });

    await expect(useCases.getTurnoById(turno.id, JUAN)).resolves.toMatchObject({ id: turno.id, situacion: "ausente" });
  });

  it("un cliente que pide un turno ajeno → 403 PROHIBIDO (decisión del ej. 9.3 de la clase 13); el admin sí lo ve", async () => {
    const { useCases, givenTurno } = buildTurnoScenario();
    const deMaria = await givenTurno({ clienteId: MARIA.id, fecha: "2026-11-10T10:00" });

    await expect(useCases.getTurnoById(deMaria.id, JUAN)).rejects.toMatchObject({ code: "PROHIBIDO", statusCode: 403 });
    await expect(useCases.getTurnoById(deMaria.id, ADMIN)).resolves.toMatchObject({ clienteId: MARIA.id });
  });

  it("inexistente → null (el 404 lo decide el controller)", async () => {
    const { useCases } = buildTurnoScenario();

    expect(await useCases.getTurnoById(999, JUAN)).toBeNull();
  });
});