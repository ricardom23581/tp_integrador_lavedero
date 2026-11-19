/**
 * Calendario con caché por año (Clase 13). Es un DECORADOR: recibe un calendario (real o falso),
 * cumple el mismo contrato (getFeriado y getFeriadosDeAnios) y le agrega la caché, sin tocar el original.
 *
 * ¿Por qué acá SÍ conviene la caché, si en la clase 12 el calendario venía sin caché?
 *  - Los feriados de un año casi nunca cambian, y cada turno nuevo (o reprogramado) consulta los mismos años:
 *    sin caché, cada POST /api/turnos sería un pedido a ArgentinaDatos.
 *  - En la clase 12 la caché habría arruinado la comparación sequential / parallel / limited / batch de
 *    /api/feriados/verificar (la 2ª consulta ya estaría cacheada). Por eso el container usa el calendario
 *    CON caché para las reglas de turnos y el calendario SIN caché para /api/feriados/verificar.
 *
 * Se guarda la PROMESA de cada año: si llegan dos turnos a la vez, comparten un solo pedido.
 * Una falla NO se guarda en la caché: el próximo turno vuelve a intentar.
 */
export function conCachePorAnio(calendario) {
  const cache = new Map(); // "2026" → Promise<{ "AAAA-MM-DD": { fecha, nombre, tipo } }>

  function feriadosDelAnio(anio) {
    const clave = String(anio);
    if (!cache.has(clave)) {
      const pendiente = calendario.getFeriadosDeAnios([clave]);
      cache.set(clave, pendiente);
      pendiente.catch(() => cache.delete(clave)); // una falla no queda guardada
    }
    return cache.get(clave);
  }

  return {
    async getFeriado(fecha) {
      const feriados = await feriadosDelAnio(fecha.slice(0, 4));
      return feriados[fecha] ?? null;
    },

    async getFeriadosDeAnios(anios) {
      const unicos = [...new Set(anios.map(String))];
      const mapas = await Promise.all(unicos.map(feriadosDelAnio));
      return Object.assign({}, ...mapas);
    },
  };
}