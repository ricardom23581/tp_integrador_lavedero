import { describe, it, expect, beforeEach, vi } from "vitest";

// Clase 14 - Ejercicio 10.2: connection/sequelize.js abre ./data/lavadero.sqlite y, además, importa config.js
// (que exige JWT_SECRET). Para el test la reemplazamos por una base SQLite EN MEMORIA: vacía en cada corrida,
// no toca tu base de desarrollo y no necesita .env. (vi.mock se "eleva" arriba de los imports: corre antes.)
vi.mock("../../connection/sequelize.js", async () => {
  const { Sequelize } = await import("sequelize");
  return { default: new Sequelize({ dialect: "sqlite", storage: ":memory:", logging: false }) };
});

import TurnosMemoryDao from "../../dao/memory/TurnosMemoryDao.js";
import TurnosSequelizeDao from "../../dao/sequelize/TurnosSequelizeDao.js";
import { sequelize, UsuarioModel } from "../../dao/models/index.js";

/**
 * TEST DE CONTRATO: los MISMOS tests corren contra los dos adaptadores (describe.each).
 * La arquitectura en capas promete que los casos de uso no se enteran de cuál DAO tienen enchufado
 * (PERSISTENCE_TYPE=memory o sequelize); este archivo es lo que CUMPLE esa promesa.
 */

const PENDIENTE = "Esperando el servicio";
const USUARIOS = [
  { id: 1, nombre: "Juan", email: "juan@test.com", rol: "user", passwordHash: "x" },
  { id: 2, nombre: "María", email: "maria@test.com", rol: "user", passwordHash: "x" },
];

const adapters = [
  {
    name: "TurnosMemoryDao",
    setup: async () => new TurnosMemoryDao(),
  },
  {
    name: "TurnosSequelizeDao (SQLite :memory:)",
    async setup() {
      await sequelize.sync({ force: true }); // borra y recrea las tablas (con el índice único parcial)
      await UsuarioModel.bulkCreate(USUARIOS);
      return new TurnosSequelizeDao();
    },
  },
];

const turno = (cambios = {}) => ({
  clienteId: 1,
  patente: "AB123CD",
  fecha: "2026-11-10T10:00",
  tipoVehiculo: "auto",
  estado: PENDIENTE,
  ...cambios,
});

describe.each(adapters)("Contrato de TurnosDao: $name", ({ setup }) => {
  let dao;

  beforeEach(async () => {
    dao = await setup();
  });

  describe("save y getById", () => {
    it("guarda, asigna id y arranca con 0 reprogramaciones; getById devuelve lo mismo", async () => {
      const creado = await dao.save(turno());

      expect(creado).toEqual({ id: expect.any(Number), reprogramaciones: 0, ...turno() });
      expect(await dao.getById(creado.id)).toEqual(creado);
    });

    it("getById de un id inexistente → null", async () => {
      expect(await dao.getById(999)).toBeNull();
    });

    it("misma patente con otro turno PENDIENTE del mismo cliente → PATENTE_CON_TURNO_PENDIENTE 409", async () => {
      await dao.save(turno());

      await expect(dao.save(turno({ fecha: "2026-11-12T10:00" }))).rejects.toMatchObject({
        code: "PATENTE_CON_TURNO_PENDIENTE",
        statusCode: 409,
      });
      expect(await dao.getAll()).toHaveLength(1);
    });

    it("el índice es PARCIAL: si el anterior ya se atendió, la patente puede volver a tener turno", async () => {
      await dao.save(turno({ estado: "Lavado finalizado" }));

      await expect(dao.save(turno())).resolves.toMatchObject({ estado: PENDIENTE });
    });

    it("la misma patente para OTRO cliente sí se puede", async () => {
      await dao.save(turno());

      await expect(dao.save(turno({ clienteId: 2 }))).resolves.toMatchObject({ clienteId: 2 });
    });

    it("con maxPendientes alcanzado → LIMITE_TURNOS_PENDIENTES 409, y no se guarda", async () => {
      await dao.save(turno({ patente: "AAA001" }));
      await dao.save(turno({ patente: "AAA002" }));

      await expect(dao.save({ ...turno({ patente: "AAA003" }), maxPendientes: 2 })).rejects.toMatchObject({
        code: "LIMITE_TURNOS_PENDIENTES",
      });
      expect(await dao.getAll()).toHaveLength(2);
    });

    it("maxPendientes NO se guarda como un dato del turno", async () => {
      const creado = await dao.save({ ...turno(), maxPendientes: 3 });

      expect(creado).not.toHaveProperty("maxPendientes");
    });

    it("tope alcanzado Y patente duplicada a la vez: ¿qué error gana?", async () => {
      await dao.save(turno({ patente: "AAA001" }));
      await dao.save(turno({ patente: "AAA002" }));

      // El caso de uso chequea primero la patente: el DAO tiene que responder lo mismo
      await expect(dao.save({ ...turno({ patente: "AAA001" }), maxPendientes: 2 })).rejects.toMatchObject({
        code: "PATENTE_CON_TURNO_PENDIENTE",
      });
    });
  });

  describe("update", () => {
    it("aplica los cambios y devuelve el turno actualizado", async () => {
      const creado = await dao.save(turno());

      expect(await dao.update(creado.id, { estado: "En proceso de lavado" })).toMatchObject({
        id: creado.id,
        estado: "En proceso de lavado",
        patente: "AB123CD",
      });
    });

    it("un id inexistente → null", async () => {
      expect(await dao.update(999, { estado: "Lavado finalizado" })).toBeNull();
    });

    it("cambiar la patente a una que ya tiene turno pendiente → PATENTE_CON_TURNO_PENDIENTE, y no cambia nada", async () => {
      await dao.save(turno({ patente: "AAA001" }));
      const otro = await dao.save(turno({ patente: "AAA002" }));

      await expect(dao.update(otro.id, { patente: "AAA001" })).rejects.toMatchObject({ code: "PATENTE_CON_TURNO_PENDIENTE" });
      expect((await dao.getById(otro.id)).patente).toBe("AAA002");
    });
  });

  describe("reprogramar", () => {
    it("con reprogramacionesPrevias al día: nueva fecha y reprogramaciones + 1", async () => {
      const creado = await dao.save(turno());

      expect(await dao.reprogramar(creado.id, { fecha: "2026-11-12T15:00", reprogramacionesPrevias: 0 })).toMatchObject({
        fecha: "2026-11-12T15:00",
        reprogramaciones: 1,
      });
    });

    it("con reprogramacionesPrevias DESACTUALIZADO (otro pedido reprogramó en el medio) → null y no cambia nada", async () => {
      const creado = await dao.save(turno());
      await dao.reprogramar(creado.id, { fecha: "2026-11-12T15:00", reprogramacionesPrevias: 0 }); // el "otro pedido"

      expect(await dao.reprogramar(creado.id, { fecha: "2026-11-13T09:00", reprogramacionesPrevias: 0 })).toBeNull();
      expect(await dao.getById(creado.id)).toMatchObject({ fecha: "2026-11-12T15:00", reprogramaciones: 1 });
    });

    it("un turno ya atendido no se reprograma → null", async () => {
      const creado = await dao.save(turno({ estado: "En proceso de lavado" }));

      expect(await dao.reprogramar(creado.id, { fecha: "2026-11-12T15:00", reprogramacionesPrevias: 0 })).toBeNull();
    });
  });

  describe("delete y deleteByClienteId", () => {
    it("delete devuelve true si borró y false si no existía", async () => {
      const creado = await dao.save(turno());

      expect(await dao.delete(creado.id)).toBe(true);
      expect(await dao.delete(creado.id)).toBe(false);
    });

    it("deleteByClienteId borra solo los de ese cliente y devuelve cuántos", async () => {
      await dao.save(turno({ patente: "AAA001" }));
      await dao.save(turno({ patente: "AAA002" }));
      await dao.save(turno({ clienteId: 2 }));

      expect(await dao.deleteByClienteId(1)).toBe(2);
      expect(await dao.getAll()).toHaveLength(1);
    });
  });

  describe("getAll", () => {
    beforeEach(async () => {
      await dao.save(turno({ patente: "AAA001", fecha: "2026-11-02T09:00" })); // pendiente y ya pasó
      await dao.save(turno({ patente: "AAA002", fecha: "2026-11-04T16:45", estado: "Lavado finalizado" }));
      await dao.save(turno({ patente: "AAA003", fecha: "2026-11-05T08:00" }));
      await dao.save(turno({ clienteId: 2, patente: "BBB001", fecha: "2026-11-06T10:00" }));
    });

    it.each([
      ["sin filtros", {}, ["AAA001", "AAA002", "AAA003", "BBB001"]],
      ["por cliente", { clienteId: 2 }, ["BBB001"]],
      ["por estado", { estado: "Lavado finalizado" }, ["AAA002"]],
      ["desde (inclusive, compara el día con la fecha-hora)", { desde: "2026-11-04" }, ["AAA002", "AAA003", "BBB001"]],
      ["hastaAntesDe (exclusive)", { hastaAntesDe: "2026-11-05" }, ["AAA001", "AAA002"]],
      ["ausentesAntesDe: pendientes de días anteriores", { ausentesAntesDe: "2026-11-05" }, ["AAA001"]],
      ["ausentesAntesDe + clienteId (no se pisan)", { ausentesAntesDe: "2026-11-10", clienteId: 2 }, ["BBB001"]],
    ])("%s", async (_, filtros, patentes) => {
      expect((await dao.getAll(filtros)).map((t) => t.patente)).toEqual(patentes);
    });
  });
});
