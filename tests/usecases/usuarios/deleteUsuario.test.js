import { describe, it, expect } from "vitest";
import { buildTurnoScenario, JUAN, MARIA, ADMIN } from "../../helpers/turnoScenario.js";
import deleteUsuario from "../../../usecases/usuarios/deleteUsuario.js";

/**
 * Clase 14 - Ejercicio 10.1: deleteUsuario estaba en 0%.
 * Reusamos el helper de turnos porque necesitamos el DAO de usuarios Y el de turnos.
 */
describe("deleteUsuario", () => {
  it("borra al cliente Y sus turnos, sin tocar los de otros clientes", async () => {
    const { usuariosDao, turnosDao, givenTurno } = buildTurnoScenario();
    await givenTurno({ clienteId: JUAN.id, patente: "AAA111", fecha: "2026-11-10T10:00" });
    await givenTurno({ clienteId: JUAN.id, patente: "BBB222", fecha: "2026-11-02T10:00", estado: "Lavado finalizado" });
    await givenTurno({ clienteId: MARIA.id, patente: "CCC333", fecha: "2026-11-10T10:00" });

    expect(await deleteUsuario(JUAN.id, usuariosDao, turnosDao)).toBe(true);

    expect(await usuariosDao.getById(JUAN.id)).toBeNull();
    expect(await turnosDao.getAll({ clienteId: JUAN.id })).toHaveLength(0);
    expect(await turnosDao.getAll({ clienteId: MARIA.id })).toHaveLength(1);
  });

  it("un administrador no se puede eliminar → 409 ADMIN_NO_ELIMINABLE, y sigue existiendo", async () => {
    const { usuariosDao, turnosDao } = buildTurnoScenario();

    await expect(deleteUsuario(ADMIN.id, usuariosDao, turnosDao)).rejects.toMatchObject({
      code: "ADMIN_NO_ELIMINABLE",
      statusCode: 409,
    });
    expect(await usuariosDao.getById(ADMIN.id)).not.toBeNull();
  });

  it("un usuario inexistente devuelve false", async () => {
    const { usuariosDao, turnosDao } = buildTurnoScenario();

    expect(await deleteUsuario(999, usuariosDao, turnosDao)).toBe(false);
  });
});