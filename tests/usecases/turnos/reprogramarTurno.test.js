import { describe, it, expect } from "vitest";
import { buildTurnoScenario, JUAN, MARIA, ADMIN } from "../../helpers/turnoScenario.js";

/**
 * reprogramarTurno (R4): una regla como CADENA de condiciones, cada una con su `code`.
 * Orden: existencia → permiso → estado → regla. Hoy (reloj fijo) es el miércoles 2026-11-04 a las 12:00.
 */
describe("reprogramarTurno", () => {
  it("reprograma: nueva fecha, reprogramaciones + 1 y sigue pendiente", async () => {
    const { useCases, givenTurno } = buildTurnoScenario();
    const turno = await givenTurno({ clienteId: JUAN.id, fecha: "2026-11-10T10:00" });

    const reprogramado = await useCases.reprogramarTurno(turno.id, { fecha: "2026-11-12T15:30" }, JUAN);

    expect(reprogramado).toMatchObject({
      fecha: "2026-11-12T15:30",
      reprogramaciones: 1,
      situacion: "pendiente",
      feriadosDisponibles: true,
    });
  });

  it("la anticipación se cuenta desde HOY, no desde la fecha anterior del turno", async () => {
    const { useCases, givenTurno } = buildTurnoScenario();
    const turno = await givenTurno({ clienteId: JUAN.id, fecha: "2026-11-25T10:00" });

    // Si se contara desde el 25, el 27 estaría dentro del plazo. Desde hoy, el límite es el 26.
    await expect(useCases.reprogramarTurno(turno.id, { fecha: "2026-11-27T10:00" }, JUAN)).rejects.toMatchObject({
      code: "FECHA_FUERA_DE_RANGO",
    });
  });

  it("turno inexistente → 404 TURNO_NO_ENCONTRADO", async () => {
    const { useCases } = buildTurnoScenario();

    await expect(useCases.reprogramarTurno(123, { fecha: "2026-11-12T10:00" }, JUAN)).rejects.toMatchObject({
      code: "TURNO_NO_ENCONTRADO",
      statusCode: 404,
    });
  });

  it("un cliente no puede reprogramar un turno ajeno → 403 PROHIBIDO", async () => {
    const { useCases, givenTurno } = buildTurnoScenario();
    const deMaria = await givenTurno({ clienteId: MARIA.id, fecha: "2026-11-10T10:00" });

    await expect(useCases.reprogramarTurno(deMaria.id, { fecha: "2026-11-12T10:00" }, JUAN)).rejects.toMatchObject({
      code: "PROHIBIDO",
      statusCode: 403,
    });
  });

  it("el admin puede reprogramar el turno de cualquiera", async () => {
    const { useCases, givenTurno } = buildTurnoScenario();
    const deMaria = await givenTurno({ clienteId: MARIA.id, fecha: "2026-11-10T10:00" });

    await expect(useCases.reprogramarTurno(deMaria.id, { fecha: "2026-11-12T10:00" }, ADMIN)).resolves.toMatchObject({
      reprogramaciones: 1,
    });
  });

  it.each(["En proceso de lavado", "Lavado finalizado"])("un turno '%s' → 409 TURNO_YA_ATENDIDO", async (estado) => {
    const { useCases, givenTurno } = buildTurnoScenario();
    const turno = await givenTurno({ clienteId: JUAN.id, fecha: "2026-11-04T09:00", estado });

    await expect(useCases.reprogramarTurno(turno.id, { fecha: "2026-11-12T10:00" }, JUAN)).rejects.toMatchObject({
      code: "TURNO_YA_ATENDIDO",
      statusCode: 409,
    });
  });

  it("orden: si es ajeno Y ya está atendido, primero responde el permiso (403), no el estado", async () => {
    const { useCases, givenTurno } = buildTurnoScenario();
    const turno = await givenTurno({ clienteId: MARIA.id, fecha: "2026-11-02T09:00", estado: "Lavado finalizado" });

    await expect(useCases.reprogramarTurno(turno.id, { fecha: "2026-11-12T10:00" }, JUAN)).rejects.toMatchObject({
      code: "PROHIBIDO",
    });
  });

  it("un turno ausente no se reprograma → 409 TURNO_AUSENTE", async () => {
    const { useCases, givenTurno } = buildTurnoScenario();
    const turno = await givenTurno({ clienteId: JUAN.id, fecha: "2026-11-03T10:00" });

    await expect(useCases.reprogramarTurno(turno.id, { fecha: "2026-11-12T10:00" }, JUAN)).rejects.toMatchObject({
      code: "TURNO_AUSENTE",
      statusCode: 409,
    });
  });

  it("borde: un turno de HOY (aunque la hora ya haya pasado) todavía se puede reprogramar", async () => {
    const { useCases, givenTurno } = buildTurnoScenario();
    const turno = await givenTurno({ clienteId: JUAN.id, fecha: "2026-11-04T08:00" });

    await expect(useCases.reprogramarTurno(turno.id, { fecha: "2026-11-12T10:00" }, JUAN)).resolves.toMatchObject({
      reprogramaciones: 1,
    });
  });

  it("la segunda reprogramación → 409 LIMITE_REPROGRAMACIONES, y la fecha no cambia", async () => {
    const { useCases, givenTurno, turnosDao } = buildTurnoScenario();
    const turno = await givenTurno({ clienteId: JUAN.id, fecha: "2026-11-10T10:00" });
    const primera = await useCases.reprogramarTurno(turno.id, { fecha: "2026-11-12T10:00" }, JUAN);

    await expect(useCases.reprogramarTurno(turno.id, { fecha: "2026-11-13T10:00" }, JUAN)).rejects.toMatchObject({
      code: "LIMITE_REPROGRAMACIONES",
      statusCode: 409,
      message: expect.stringContaining("1 vez"),
    });

    const despues = await turnosDao.getById(turno.id);
    expect(despues.fecha).toBe(primera.fecha);
    expect(despues.reprogramaciones).toBe(1);
  });

  it("el límite es configuración: con maxReprogramaciones = 2 se reprograma dos veces", async () => {
    const { useCases, givenTurno } = buildTurnoScenario({ reglas: { maxReprogramaciones: 2 } });
    const turno = await givenTurno({ clienteId: JUAN.id, fecha: "2026-11-10T10:00", reprogramaciones: 1 });

    await expect(useCases.reprogramarTurno(turno.id, { fecha: "2026-11-12T10:00" }, JUAN)).resolves.toMatchObject({
      reprogramaciones: 2,
    });
    await expect(useCases.reprogramarTurno(turno.id, { fecha: "2026-11-13T10:00" }, JUAN)).rejects.toMatchObject({
      code: "LIMITE_REPROGRAMACIONES",
      message: expect.stringContaining("2 veces"),
    });
  });

  it.each([
    ["una fecha pasada", "2026-11-03T10:00", "FECHA_PASADA"],
    ["un feriado", "2026-11-23T10:00", "FECHA_FERIADO"],
    ["fuera de plazo", "2026-11-27T10:00", "FECHA_FUERA_DE_RANGO"],
  ])("la nueva fecha cumple las mismas reglas que al crear: %s → 422 %s", async (_, fecha, code) => {
    const { useCases, givenTurno } = buildTurnoScenario();
    const turno = await givenTurno({ clienteId: JUAN.id, fecha: "2026-11-10T10:00" });

    await expect(useCases.reprogramarTurno(turno.id, { fecha }, JUAN)).rejects.toMatchObject({ code, statusCode: 422 });
  });

  it("si el turno cambió entre la lectura y la escritura → 409 TURNO_CAMBIO", async () => {
    const { useCases, givenTurno, turnosDao } = buildTurnoScenario();
    const turno = await givenTurno({ clienteId: JUAN.id, fecha: "2026-11-10T10:00" });
    // Simulamos la carrera: el DAO devuelve null, como si otro pedido lo hubiera reprogramado justo antes
    turnosDao.reprogramar = async () => null;

    await expect(useCases.reprogramarTurno(turno.id, { fecha: "2026-11-12T10:00" }, JUAN)).rejects.toMatchObject({
      code: "TURNO_CAMBIO",
      statusCode: 409,
    });
  });
  // Clase 14 - Ejercicio 10.3 (TDD): R6 se escribió TEST PRIMERO. Este fue el primer test, y arrancó en ROJO.
  describe("R6: no se reprograma si el cliente tiene OTRO turno ausente", () => {
    it("tiene otro turno ausente → 409 CLIENTE_CON_AUSENCIAS (con el detalle) y la fecha no cambia", async () => {
      const { useCases, givenTurno, turnosDao } = buildTurnoScenario(); // hoy: 2026-11-04
      const turno = await givenTurno({ clienteId: JUAN.id, patente: "AAA111", fecha: "2026-11-10T10:00" });
      const ausente = await givenTurno({ clienteId: JUAN.id, patente: "BBB222", fecha: "2026-11-02T09:00" });

      await expect(useCases.reprogramarTurno(turno.id, { fecha: "2026-11-12T10:00" }, JUAN)).rejects.toMatchObject({
        code: "CLIENTE_CON_AUSENCIAS",
        statusCode: 409,
        details: [{ turnoId: ausente.id, patente: "BBB222", fecha: "2026-11-02T09:00" }],
      });
      expect(await turnosDao.getById(turno.id)).toMatchObject({ fecha: "2026-11-10T10:00", reprogramaciones: 0 });
    });

    // Los que siguen se agregaron DESPUÉS del verde: cuidan los bordes de la regla
    it("un turno viejo que SÍ se atendió no bloquea", async () => {
      const { useCases, givenTurno } = buildTurnoScenario();
      const turno = await givenTurno({ clienteId: JUAN.id, patente: "AAA111", fecha: "2026-11-10T10:00" });
      await givenTurno({ clienteId: JUAN.id, patente: "BBB222", fecha: "2026-11-02T09:00", estado: "Lavado finalizado" });

      await expect(useCases.reprogramarTurno(turno.id, { fecha: "2026-11-12T10:00" }, JUAN)).resolves.toMatchObject({
        reprogramaciones: 1,
      });
    });

    it("el ausente de OTRO cliente no bloquea", async () => {
      const { useCases, givenTurno } = buildTurnoScenario();
      const turno = await givenTurno({ clienteId: JUAN.id, patente: "AAA111", fecha: "2026-11-10T10:00" });
      await givenTurno({ clienteId: MARIA.id, patente: "BBB222", fecha: "2026-11-02T09:00" });

      await expect(useCases.reprogramarTurno(turno.id, { fecha: "2026-11-12T10:00" }, JUAN)).resolves.toMatchObject({
        reprogramaciones: 1,
      });
    });

    it("se mira al DUEÑO del turno, no a quien reprograma: el admin tampoco puede", async () => {
      const { useCases, givenTurno } = buildTurnoScenario();
      const turno = await givenTurno({ clienteId: JUAN.id, patente: "AAA111", fecha: "2026-11-10T10:00" });
      await givenTurno({ clienteId: JUAN.id, patente: "BBB222", fecha: "2026-11-02T09:00" });

      await expect(useCases.reprogramarTurno(turno.id, { fecha: "2026-11-12T10:00" }, ADMIN)).rejects.toMatchObject({
        code: "CLIENTE_CON_AUSENCIAS",
      });
    });

    it("orden: si el turno que quiere reprogramar es EL ausente, responde TURNO_AUSENTE (R6 habla de OTRO)", async () => {
      const { useCases, givenTurno } = buildTurnoScenario();
      const turno = await givenTurno({ clienteId: JUAN.id, patente: "AAA111", fecha: "2026-11-02T09:00" });

      await expect(useCases.reprogramarTurno(turno.id, { fecha: "2026-11-12T10:00" }, JUAN)).rejects.toMatchObject({
        code: "TURNO_AUSENTE",
      });
    });

    it("borde: otro turno de HOY a la mañana todavía no es ausente, no bloquea", async () => {
      const { useCases, givenTurno } = buildTurnoScenario();
      const turno = await givenTurno({ clienteId: JUAN.id, patente: "AAA111", fecha: "2026-11-10T10:00" });
      await givenTurno({ clienteId: JUAN.id, patente: "BBB222", fecha: "2026-11-04T08:00" });

      await expect(useCases.reprogramarTurno(turno.id, { fecha: "2026-11-12T10:00" }, JUAN)).resolves.toMatchObject({
        reprogramaciones: 1,
      });
    });
  });
});