import { describe, it, expect, vi } from "vitest";
import { buildTurnoScenario, JUAN } from "../../helpers/turnoScenario.js";
import { EVENTS } from "../../../events/eventNames.js";

/**
 * updateTurno: el evento "turno.finalizado" se emite solo cuando el estado PASA a "Lavado finalizado".
 * (El listener le avisa al cliente que retire el auto: avisar dos veces sería un bug visible.)
 */
describe("updateTurno", () => {
  async function escenarioConListener(estadoInicial) {
    const scenario = buildTurnoScenario();
    const turno = await scenario.givenTurno({ clienteId: JUAN.id, fecha: "2026-11-04T10:00", estado: estadoInicial });
    const listener = vi.fn();
    scenario.events.on(EVENTS.TURNO_FINALIZADO, listener);
    return { ...scenario, turno, listener };
  }

  it("al pasar a 'Lavado finalizado' emite turno.finalizado una vez, con el turno actualizado", async () => {
    const { useCases, turno, listener } = await escenarioConListener("En proceso de lavado");

    const actualizado = await useCases.updateTurno(turno.id, { estado: "Lavado finalizado" });

    expect(actualizado).toMatchObject({ estado: "Lavado finalizado", situacion: "finalizado" });
    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ id: turno.id, estado: "Lavado finalizado" }));
  });

  it("si YA estaba finalizado, no vuelve a avisar", async () => {
    const { useCases, turno, listener } = await escenarioConListener("Lavado finalizado");

    await useCases.updateTurno(turno.id, { estado: "Lavado finalizado", tipoVehiculo: "camioneta" });

    expect(listener).not.toHaveBeenCalled();
  });

  it("un cambio que no es de estado no emite nada", async () => {
    const { useCases, turno, listener } = await escenarioConListener("Esperando el servicio");

    await useCases.updateTurno(turno.id, { tipoVehiculo: "moto" });

    expect(listener).not.toHaveBeenCalled();
  });

  it("un turno inexistente devuelve null y no emite", async () => {
    const { useCases, listener } = await escenarioConListener("En proceso de lavado");

    expect(await useCases.updateTurno(999, { estado: "Lavado finalizado" })).toBeNull();
    expect(listener).not.toHaveBeenCalled();
  });
});