import { describe, it, expect, vi } from "vitest";
import { buildTurnoScenario, nuevoTurno, JUAN, MARIA, ADMIN } from "../../helpers/turnoScenario.js";
import createFakeCalendario from "../../../gateways/fakeCalendario.js";
import { EVENTS } from "../../../events/eventNames.js";

/**
 * createTurno, regla por regla. Cada test se nombra "situación → resultado".
 * Hoy (reloj fijo) es el miércoles 2026-11-04 a las 12:00. Límite R2 por defecto: jueves 2026-11-26.
 */
describe("createTurno", () => {
  describe("caso feliz", () => {
    it("crea el turno pendiente a nombre del cliente, con su situación y feriadosDisponibles", async () => {
      const { useCases, pendientesDe } = buildTurnoScenario();

      const turno = await useCases.createTurno(nuevoTurno(), JUAN);

      expect(turno).toMatchObject({
        id: expect.any(Number),
        clienteId: JUAN.id,
        patente: "AB123CD",
        fecha: "2026-11-10T10:00",
        estado: "Esperando el servicio",
        reprogramaciones: 0,
        situacion: "pendiente",
        diasAusente: 0,
        feriadosDisponibles: true,
      });
      expect(await pendientesDe(JUAN.id)).toHaveLength(1);
    });

    it("el estado inicial lo fija el servidor, aunque el cliente mande otro", async () => {
      const { useCases } = buildTurnoScenario();

      const turno = await useCases.createTurno(nuevoTurno({ estado: "Lavado finalizado" }), JUAN);

      expect(turno.estado).toBe("Esperando el servicio");
    });

    it("el DAO no recibe ni guarda maxPendientes como un dato del turno", async () => {
      const { useCases, turnosDao } = buildTurnoScenario();

      const turno = await useCases.createTurno(nuevoTurno(), JUAN);

      expect(await turnosDao.getById(turno.id)).not.toHaveProperty("maxPendientes");
    });
  });

  describe("permisos y existencia", () => {
    it("un cliente que pide a nombre de otro → 403 PROHIBIDO", async () => {
      const { useCases } = buildTurnoScenario();

      await expect(useCases.createTurno(nuevoTurno({ clienteId: MARIA.id }), JUAN)).rejects.toMatchObject({
        code: "PROHIBIDO",
        statusCode: 403,
      });
    });

    it("el admin SÍ puede sacar un turno a nombre de un cliente (ej. un pedido por teléfono)", async () => {
      const { useCases } = buildTurnoScenario();

      await expect(useCases.createTurno(nuevoTurno({ clienteId: MARIA.id }), ADMIN)).resolves.toMatchObject({
        clienteId: MARIA.id,
      });
    });

    it("cliente inexistente → 404 USUARIO_NO_ENCONTRADO", async () => {
      const { useCases } = buildTurnoScenario();

      await expect(useCases.createTurno(nuevoTurno({ clienteId: 500 }), ADMIN)).rejects.toMatchObject({
        code: "USUARIO_NO_ENCONTRADO",
        statusCode: 404,
      });
    });
  });

  describe("fecha futura", () => {
    it.each([
      ["un día que ya pasó", "2026-11-03T10:00"],
      ["hoy, más temprano", "2026-11-04T09:00"],
      ["borde: AHORA mismo", "2026-11-04T12:00"],
    ])("%s → 422 FECHA_PASADA", async (_, fecha) => {
      const { useCases } = buildTurnoScenario();

      await expect(useCases.createTurno(nuevoTurno({ fecha }), JUAN)).rejects.toMatchObject({
        code: "FECHA_PASADA",
        statusCode: 422,
      });
    });

    it("borde: hoy, el próximo turno (12:15) sí se puede", async () => {
      const { useCases } = buildTurnoScenario();

      await expect(useCases.createTurno(nuevoTurno({ fecha: "2026-11-04T12:15" }), JUAN)).resolves.toBeTruthy();
    });
  });

  describe("patente con turno pendiente", () => {
    it("la misma patente con otro turno pendiente → 409 PATENTE_CON_TURNO_PENDIENTE, y no se guarda nada", async () => {
      const { useCases, givenTurno, pendientesDe } = buildTurnoScenario();
      await givenTurno({ clienteId: JUAN.id, fecha: "2026-11-06T10:00" });

      await expect(useCases.createTurno(nuevoTurno(), JUAN)).rejects.toMatchObject({
        code: "PATENTE_CON_TURNO_PENDIENTE",
        statusCode: 409,
      });
      expect(await pendientesDe(JUAN.id)).toHaveLength(1);
    });

    it("si el turno anterior de esa patente ya se atendió, puede sacar otro", async () => {
      const { useCases, givenTurno } = buildTurnoScenario();
      await givenTurno({ clienteId: JUAN.id, fecha: "2026-11-02T10:00", estado: "Lavado finalizado" });

      await expect(useCases.createTurno(nuevoTurno(), JUAN)).resolves.toBeTruthy();
    });
  });

  describe("R1: tope de turnos pendientes", () => {
    // Tres patentes distintas: así la regla de "patente duplicada" no se mezcla con R1
    const conPendientes = async (givenTurno, cantidad, clienteId = JUAN.id) => {
      for (let i = 1; i <= cantidad; i++) {
        await givenTurno({ clienteId, patente: `AAA00${i}`, fecha: `2026-11-1${i}T10:00` });
      }
    };

    it("borde: con 2 pendientes, el tercero se acepta", async () => {
      const { useCases, givenTurno } = buildTurnoScenario();
      await conPendientes(givenTurno, 2);

      await expect(useCases.createTurno(nuevoTurno(), JUAN)).resolves.toBeTruthy();
    });

    it("con 3 pendientes, el cuarto → 409 LIMITE_TURNOS_PENDIENTES y el mensaje dice el tope", async () => {
      const { useCases, givenTurno } = buildTurnoScenario();
      await conPendientes(givenTurno, 3);

      await expect(useCases.createTurno(nuevoTurno(), JUAN)).rejects.toMatchObject({
        code: "LIMITE_TURNOS_PENDIENTES",
        statusCode: 409,
        message: expect.stringContaining("hasta 3"),
      });
    });

        // Ejercicio 9.3 — este test se agregó porque la mutación `>=` por `>` en R1 NO hacía fallar ningún test:
    // el DAO vuelve a contar los pendientes dentro del alta (ej. 9.1 de la clase 13) y rechaza con el MISMO código.
    // Lo único que cambia es que el pedido llega más lejos: consulta el calendario. Eso es lo que verificamos.
    it("R1 corta en el caso de uso (fail fast): con el tope alcanzado, NO se consulta el calendario", async () => {
      const { useCases, givenTurno, calendario } = buildTurnoScenario();
      await conPendientes(givenTurno, 3);
      const spy = vi.spyOn(calendario, "getFeriadosDeAnios");

      await expect(useCases.createTurno(nuevoTurno(), JUAN)).rejects.toMatchObject({ code: "LIMITE_TURNOS_PENDIENTES" });
      expect(spy).not.toHaveBeenCalled();
    });

    it("tras el rechazo, la cantidad de pendientes no cambió", async () => {
      const { useCases, givenTurno, pendientesDe } = buildTurnoScenario();
      await conPendientes(givenTurno, 3);

      await useCases.createTurno(nuevoTurno(), JUAN).catch(() => {});

      expect(await pendientesDe(JUAN.id)).toHaveLength(3);
    });

    it("los turnos ya atendidos no cuentan", async () => {
      const { useCases, givenTurno } = buildTurnoScenario();
      await conPendientes(givenTurno, 2);
      await givenTurno({ clienteId: JUAN.id, patente: "ZZZ999", fecha: "2026-11-02T10:00", estado: "Lavado finalizado" });

      await expect(useCases.createTurno(nuevoTurno(), JUAN)).resolves.toBeTruthy();
    });

    it("el tope es POR CLIENTE: los pendientes de María no afectan a Juan", async () => {
      const { useCases, givenTurno } = buildTurnoScenario();
      await conPendientes(givenTurno, 3, MARIA.id);

      await expect(useCases.createTurno(nuevoTurno(), JUAN)).resolves.toBeTruthy();
    });

    it("el tope es configuración: con maxPendientes = 1, el segundo ya se rechaza", async () => {
      const { useCases, givenTurno } = buildTurnoScenario({ reglas: { maxPendientes: 1 } });
      await conPendientes(givenTurno, 1);

      await expect(useCases.createTurno(nuevoTurno(), JUAN)).rejects.toMatchObject({
        code: "LIMITE_TURNOS_PENDIENTES",
        message: expect.stringContaining("hasta 1"),
      });
    });
  });

  describe("R3: cliente con ausencias", () => {
    it("con un turno ausente → 409 CLIENTE_CON_AUSENCIAS, con el turno ausente en details", async () => {
      const { useCases, givenTurno } = buildTurnoScenario();
      const ausente = await givenTurno({ clienteId: JUAN.id, patente: "OLD111", fecha: "2026-11-02T09:00" });

      await expect(useCases.createTurno(nuevoTurno(), JUAN)).rejects.toMatchObject({
        code: "CLIENTE_CON_AUSENCIAS",
        statusCode: 409,
        details: [{ turnoId: ausente.id, patente: "OLD111", fecha: "2026-11-02T09:00" }],
      });
    });

    it("borde: un turno de HOY a la mañana todavía no es ausente → puede sacar otro", async () => {
      const { useCases, givenTurno } = buildTurnoScenario();
      await givenTurno({ clienteId: JUAN.id, patente: "OLD111", fecha: "2026-11-04T08:00" });

      await expect(useCases.createTurno(nuevoTurno(), JUAN)).resolves.toBeTruthy();
    });

    it("el MISMO escenario al día siguiente (otro reloj) sí se rechaza", async () => {
      const { useCases, givenTurno } = buildTurnoScenario({ now: "2026-11-05T12:00:00-03:00" });
      await givenTurno({ clienteId: JUAN.id, patente: "OLD111", fecha: "2026-11-04T08:00" });

      await expect(useCases.createTurno(nuevoTurno(), JUAN)).rejects.toMatchObject({ code: "CLIENTE_CON_AUSENCIAS" });
    });

    it("orden: con 3 pendientes y uno de ellos ausente, el error es CLIENTE_CON_AUSENCIAS (no el tope)", async () => {
      const { useCases, givenTurno } = buildTurnoScenario();
      await givenTurno({ clienteId: JUAN.id, patente: "OLD111", fecha: "2026-11-02T09:00" });
      await givenTurno({ clienteId: JUAN.id, patente: "AAA001", fecha: "2026-11-11T10:00" });
      await givenTurno({ clienteId: JUAN.id, patente: "AAA002", fecha: "2026-11-12T10:00" });

      await expect(useCases.createTurno(nuevoTurno(), JUAN)).rejects.toMatchObject({ code: "CLIENTE_CON_AUSENCIAS" });
    });
  });

  describe("R2 y el calendario de feriados", () => {
    it("borde: el último día hábil permitido (jueves 26, por el feriado del 23) se acepta", async () => {
      const { useCases } = buildTurnoScenario();

      await expect(useCases.createTurno(nuevoTurno({ fecha: "2026-11-26T16:45" }), JUAN)).resolves.toBeTruthy();
    });

    it("un día después del límite → 422 FECHA_FUERA_DE_RANGO, y el mensaje dice hasta cuándo", async () => {
      const { useCases } = buildTurnoScenario();

      await expect(useCases.createTurno(nuevoTurno({ fecha: "2026-11-27T10:00" }), JUAN)).rejects.toMatchObject({
        code: "FECHA_FUERA_DE_RANGO",
        statusCode: 422,
        message: expect.stringContaining("2026-11-26"),
      });
    });

    it("un feriado → 422 FECHA_FERIADO", async () => {
      const { useCases } = buildTurnoScenario();

      await expect(useCases.createTurno(nuevoTurno({ fecha: "2026-11-23T10:00" }), JUAN)).rejects.toMatchObject({
        code: "FECHA_FERIADO",
        statusCode: 422,
        message: expect.stringContaining("Soberanía"),
      });
    });

    it("fail fast: si una regla anterior rechaza, el calendario NO se consulta", async () => {
      const { useCases, givenTurno, calendario } = buildTurnoScenario();
      const spy = vi.spyOn(calendario, "getFeriadosDeAnios");
      await givenTurno({ clienteId: JUAN.id, fecha: "2026-11-06T10:00" }); // misma patente pendiente

      await expect(useCases.createTurno(nuevoTurno(), JUAN)).rejects.toMatchObject({ code: "PATENTE_CON_TURNO_PENDIENTE" });
      expect(spy).not.toHaveBeenCalled();

      // Y un pedido válido sí lo consulta (el spy está bien puesto)
      await useCases.createTurno(nuevoTurno({ patente: "OTRA123" }), JUAN);
      expect(spy).toHaveBeenCalledOnce();
    });

    it("calendario caído: degrada, crea el turno con feriadosDisponibles: false y avisa por consola", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {}); // silenciado y espiado
      const { useCases } = buildTurnoScenario({ calendario: createFakeCalendario({ latencyMs: 0, fail: true }) });

      // Sin feriados no se sabe que el 23 lo es: se acepta (la degradación es aceptar, no rechazar)
      const turno = await useCases.createTurno(nuevoTurno({ fecha: "2026-11-23T10:00" }), JUAN);

      expect(turno).toMatchObject({ estado: "Esperando el servicio", feriadosDisponibles: false });
      expect(warn).toHaveBeenCalledOnce();
    });

    it("calendario caído: el límite se calcula solo con fines de semana (el 26 ya queda afuera)", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      const { useCases } = buildTurnoScenario({ calendario: createFakeCalendario({ latencyMs: 0, fail: true }) });

      await expect(useCases.createTurno(nuevoTurno({ fecha: "2026-11-26T10:00" }), JUAN)).rejects.toMatchObject({
        code: "FECHA_FUERA_DE_RANGO",
        message: expect.stringContaining("2026-11-25"),
      });
    });

    it("un bug propio en el calendario (TypeError) NO se oculta: se propaga y no se guarda nada", async () => {
      const calendarioRoto = { getFeriadosDeAnios: vi.fn().mockRejectedValue(new TypeError("x is not a function")) };
      const { useCases, pendientesDe } = buildTurnoScenario({ calendario: calendarioRoto });

      await expect(useCases.createTurno(nuevoTurno(), JUAN)).rejects.toThrow(TypeError);
      expect(await pendientesDe(JUAN.id)).toHaveLength(0);
    });
  });

  describe("evento turno.creado", () => {
    it("se emite una vez, con el turno guardado", async () => {
      const { useCases, events } = buildTurnoScenario();
      const listener = vi.fn();
      events.on(EVENTS.TURNO_CREADO, listener);

      const turno = await useCases.createTurno(nuevoTurno(), JUAN);

      expect(listener).toHaveBeenCalledOnce();
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ id: turno.id, patente: "AB123CD" }));
    });

    it("si el pedido se rechaza, NO se emite", async () => {
      const { useCases, events } = buildTurnoScenario();
      const listener = vi.fn();
      events.on(EVENTS.TURNO_CREADO, listener);

      await useCases.createTurno(nuevoTurno({ fecha: "2026-11-03T10:00" }), JUAN).catch(() => {});

      expect(listener).not.toHaveBeenCalled();
    });
  });
});