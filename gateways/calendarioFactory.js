import createFeriadosGateway from "./feriadosGateway.js";
import createFakeCalendario from "./fakeCalendario.js";

/**
 * Factory de calendarios (igual que daoFactory y notifierFactory).
 * Según config.calendario.type devuelve la API real de ArgentinaDatos o un calendario falso sin red.
 * Los dos cumplen el mismo contrato: getFeriado(fecha) y getFeriadosDeAnios(anios).
 */
export function getCalendario({ type, baseUrl, timeoutMs, fakeLatencyMs }) {
  if (type === "fake") {
    console.log(`[Calendario] Usando calendario FALSO (demora simulada: ${fakeLatencyMs} ms por pedido)`);
    return createFakeCalendario({ latencyMs: fakeLatencyMs });
  }
  console.log(`[Calendario] Usando ArgentinaDatos (${baseUrl})`);
  return createFeriadosGateway({ baseUrl, timeoutMs });
}