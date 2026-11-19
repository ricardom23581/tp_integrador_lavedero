import createFeriadosGateway from "./feriadosGateway.js";
import createFakeCalendario from "./fakeCalendario.js";

/**
 * Factory de calendarios (igual que daoFactory y notifierFactory).
 * Según config.calendario.type devuelve la API real de ArgentinaDatos o un calendario falso sin red.
 * Los dos cumplen el mismo contrato: getFeriado(fecha) y getFeriadosDeAnios(anios).
 * Clase 13: "fake-down" es el calendario falso simulando que la API está caída.
 */
export function getCalendario({ type, baseUrl, timeoutMs, fakeLatencyMs }) {
  if (type === "fake" || type === "fake-down") {
    const fail = type === "fake-down";
    console.log(
      `[Calendario] Usando calendario FALSO (demora simulada: ${fakeLatencyMs} ms por pedido)${fail ? " — simulando API CAÍDA" : ""}`
    );
    return createFakeCalendario({ latencyMs: fakeLatencyMs, fail });
  }
  console.log(`[Calendario] Usando ArgentinaDatos (${baseUrl})`);
  return createFeriadosGateway({ baseUrl, timeoutMs });
}