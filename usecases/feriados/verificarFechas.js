import mapWithConcurrency from "../../utils/mapWithConcurrency.js";

// Ej. 4 — Medición con 5 fechas de 2026 (fake = 300 ms por pedido; real = ArgentinaDatos desde mi conexión):
//
//   | Modo        | Pedidos HTTP | Tiempo (fake) | Tiempo (real) |
//   | sequential  | 5            | COMPLETAR     | COMPLETAR     |
//   | parallel    | 5            | COMPLETAR     | COMPLETAR     |
//   | limited (3) | 5            | COMPLETAR     | COMPLETAR     |
//   | batch       | 1            | COMPLETAR     | COMPLETAR     |
//
// ¿Por qué con una fecha de 1999 (falla simulada en el fake) en "batch" fallan solo las fechas de 1999,
// pero si TODAS fueran del mismo año fallarían todas? Porque batch hace UN pedido por año: si ese pedido
// falla, no hay respuesta para ninguna fecha de ese año. En parallel cada fecha es un pedido independiente.

/**
 * Caso de uso: verificar si varias fechas son feriado, con la estrategia que se elija.
 * Existe para comparar las formas de consultar una API externa (mismo resultado, distinto tiempo):
 *   - sequential: de a una, esperando cada respuesta (for...of + await).
 *   - parallel:   todas a la vez (Promise.allSettled).
 *   - limited:    en paralelo pero con tope de simultáneos (mapWithConcurrency).
 *   - batch:      agrupadas por año: un solo pedido por año distinto.
 * Cada fecha tiene su propio resultado: que una falle no tira abajo a las demás.
 */
async function verificarFechas({ fechas, mode }, calendario, { concurrency }) {
  const inicio = performance.now();
  let httpRequests = fechas.length;

  // Convierte lo que devolvió (o el error que lanzó) una consulta en un resultado uniforme
  const toResultado = (fecha, settled) => {
    if (settled.status === "rejected") {
      return { fecha, status: "failed", error: { code: settled.reason.code ?? "ERROR", message: settled.reason.message } };
    }
    return settled.value ? { fecha, status: "feriado", feriado: settled.value } : { fecha, status: "habil" };
  };

  let resultados;
  if (mode === "sequential") {
    resultados = [];
    for (const fecha of fechas) {
      // await dentro del for: cada pedido espera a que termine el anterior
      const settled = await calendario.getFeriado(fecha).then(
        (value) => ({ status: "fulfilled", value }),
        (reason) => ({ status: "rejected", reason })
      );
      resultados.push(toResultado(fecha, settled));
    }
  } else if (mode === "parallel") {
    // Se lanzan todos juntos y se espera a que terminen TODOS, sea bien o mal
    const settled = await Promise.allSettled(fechas.map((fecha) => calendario.getFeriado(fecha)));
    resultados = settled.map((r, i) => toResultado(fechas[i], r));
  } else if (mode === "limited") {
    // Como parallel, pero nunca más de `concurrency` pedidos al mismo tiempo
    const settled = await mapWithConcurrency(fechas, concurrency, (fecha) => calendario.getFeriado(fecha));
    resultados = settled.map((r, i) => toResultado(fechas[i], r));
  } else {
    // batch: un pedido por año. Si el pedido de un año falla, fallan todas las fechas de ese año.
    const anios = [...new Set(fechas.map((f) => f.slice(0, 4)))];
    httpRequests = anios.length;
    const porAnio = await Promise.allSettled(anios.map((anio) => calendario.getFeriadosDeAnios([anio])));
    const resultadoDeAnio = Object.fromEntries(anios.map((anio, i) => [anio, porAnio[i]]));
    resultados = fechas.map((fecha) => {
      const r = resultadoDeAnio[fecha.slice(0, 4)];
      if (r.status === "rejected") return toResultado(fecha, r);
      return toResultado(fecha, { status: "fulfilled", value: r.value[fecha] ?? null });
    });
  }

  return {
    mode,
    consultadas: fechas.length,
    httpRequests,
    elapsedMs: Math.round(performance.now() - inicio),
    resultados,
  };
}

export default verificarFechas;
