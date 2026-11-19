import AppError from "../../errors/AppError.js";
import { sumarDiasCorridos } from "../../domain/diasHabiles.js";
import { conSituacion } from "../../domain/situacionTurno.js";

/**
 * Caso de uso: listar turnos con filtros, orden y paginación.
 * Recibe los filtros ya validados por Zod y las dependencias por parámetro (inversión de dependencias).
 * Devuelve { items, total }: total es la cantidad antes de paginar (para X-Total-Count).
 *
 * Regla de acceso: un cliente (rol "user") siempre ve solo sus turnos; si pide los de otro
 * cliente con ?clienteId=, recibe 403. El admin ve todos y puede filtrar por cualquier cliente.
 *
 * Clase 13:
 *  - clienteId, estado, desde y hasta los resuelve el DAO (en Sequelize, un WHERE en la base).
 *    `hasta` es inclusive: se traduce a "antes del día siguiente" ([desde, hasta + 1 día)).
 *    Las fechas de los turnos ya están en hora del lavadero ("AAAA-MM-DDTHH:mm"), así que alcanza con comparar texto.
 *  - Cada turno vuelve con su `situacion` calculada (pendiente / ausente / en proceso / finalizado).
 *  - Ejercicio 9.2: `ausentes=true` también lo resuelve la BASE aunque "ausente" no sea una columna:
 *    ausente = estado "Esperando el servicio" AND fecha < hoy. El caso de uso solo aporta "hoy" (del reloj).
 */
async function getTurnos(filters, actor, { turnosDao, clock }) {
  if (actor.rol !== "admin") {
    if (filters.clienteId !== undefined && filters.clienteId !== actor.id) {
      throw new AppError("PROHIBIDO", "No tenés permiso para ver turnos de otros clientes", 403);
    }
    filters = { ...filters, clienteId: actor.id };
  }

  const { estado, tipoVehiculo, clienteId, fecha, patente, desde, hasta, ausentes, sort, page, limit } = filters;
  const hoy = clock.hoy();

  // 1) Filtros que resuelve la base
  let turnos = await turnosDao.getAll({
    clienteId,
    estado,
    desde,
    hastaAntesDe: hasta && sumarDiasCorridos(hasta, 1),
    ausentesAntesDe: ausentes ? hoy : undefined,
  });

  // 2) Filtros que quedan en JavaScript (como hasta la clase 12)
  if (tipoVehiculo) turnos = turnos.filter((t) => t.tipoVehiculo === tipoVehiculo);
  if (fecha) turnos = turnos.filter((t) => t.fecha.startsWith(fecha));
  if (patente) turnos = turnos.filter((t) => t.patente === patente);

  // 3) Orden (?sort=fecha o ?sort=-fecha)
  if (sort) {
    const desc = sort.startsWith("-");
    const campo = desc ? sort.slice(1) : sort;
    turnos.sort((a, b) => {
      if (a[campo] < b[campo]) return desc ? 1 : -1;
      if (a[campo] > b[campo]) return desc ? -1 : 1;
      return 0;
    });
  }

  // 4) Paginación, y la situación calculada de cada turno de la página
  const total = turnos.length;
  const inicio = (page - 1) * limit;
  return { items: turnos.slice(inicio, inicio + limit).map((t) => conSituacion(t, hoy)), total };
}

export default getTurnos;