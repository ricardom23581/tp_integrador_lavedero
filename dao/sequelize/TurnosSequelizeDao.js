/**
 * DAO de turnos con Sequelize. Misma interfaz que TurnosMemoryDao.
 * Devuelve siempre objetos planos, nunca instancias del ORM.
 */
import { Op, literal, UniqueConstraintError, Transaction } from "sequelize";
import AppError from "../../errors/AppError.js";
import { sequelize, TurnoModel } from "../models/index.js";

const PENDIENTE = "Esperando el servicio";

// El índice único parcial rechazó un segundo turno pendiente del mismo cliente para la misma patente.
// El adaptador traduce el error de la base a uno del dominio (el resto de la app no conoce Sequelize).
async function traducirDuplicado(operacion) {
  try {
    return await operacion();
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      throw new AppError("PATENTE_CON_TURNO_PENDIENTE", "El cliente ya tiene un turno pendiente para esa patente", 409);
    }
    throw err;
  }
}

export default class TurnosSequelizeDao {
  #seed;

  constructor(seed = []) {
    this.#seed = seed;
  }

  // Crea la tabla si no existe y carga el seed solo si está vacía.
  // Corre DESPUÉS de usuarios: los turnos referencian a usuarios (clave foránea).
  async init() {
    await TurnoModel.sync();
    if ((await TurnoModel.count()) === 0) {
      await TurnoModel.bulkCreate(this.#seed);
    }
  }

  // Clase 13 — filtros opcionales que resuelve la BASE (WHERE), no JavaScript:
  //  - clienteId, estado: igualdad
  //  - desde (inclusive) y hastaAntesDe (exclusive): días "AAAA-MM-DD". La fecha se guarda como texto
  //    "AAAA-MM-DDTHH:mm", que ordena igual que las fechas: "2026-11-24T10:00" >= "2026-11-24" es true.
  //  - ausentesAntesDe ("AAAA-MM-DD", Ejercicio 9.2): pendientes con fecha anterior a ese día.
  // Sin filtros devuelve todos (como antes).
  async getAll({ clienteId, estado, desde, hastaAntesDe, ausentesAntesDe } = {}) {
    const where = {};
    if (clienteId !== undefined) where.clienteId = clienteId;
    if (estado !== undefined) where.estado = estado;
    if (desde !== undefined || hastaAntesDe !== undefined) {
      where.fecha = {
        ...(desde !== undefined && { [Op.gte]: desde }),
        ...(hastaAntesDe !== undefined && { [Op.lt]: hastaAntesDe }),
      };
    }
    if (ausentesAntesDe !== undefined) {
      // "Ausente" no es una columna, pero se puede resolver en la base igual:
      // WHERE estado = 'Esperando el servicio' AND fecha < '2026-11-19'
      // Va con Op.and para no pisar los filtros `estado` y `fecha` de arriba.
      where[Op.and] = [{ estado: PENDIENTE }, { fecha: { [Op.lt]: ausentesAntesDe } }];
    }
    return TurnoModel.findAll({ where, raw: true, order: [["id", "ASC"]] });
  }

  async getById(id) {
    return TurnoModel.findByPk(id, { raw: true });
  }

    // Ejercicio 9.1 — R1 sin carrera: si llega `maxPendientes`, el CONTEO de pendientes del cliente y el ALTA van
  // en la MISMA transacción. El índice único no puede expresar "como máximo 3", así que la base no lo frena sola.
  // En SQLite, una transacción IMMEDIATE toma el lock de escritura al empezar: un segundo pedido simultáneo
  // espera a que termine el primero y, cuando cuenta, ya ve el turno nuevo. (En PostgreSQL/MySQL se haría
  // con SELECT ... FOR UPDATE sobre el cliente, o con nivel SERIALIZABLE.)
  // Clase 14 - Ej. 10.2: el test de contrato mostró que, con el tope alcanzado Y la patente duplicada a la vez,
  // este adaptador respondía LIMITE_TURNOS_PENDIENTES y el de memoria PATENTE_CON_TURNO_PENDIENTE (que es lo que
  // también responde el caso de uso, que chequea la patente primero). Ahora el orden es el mismo que en memoria:
  // primero el ALTA (el índice único parcial rechaza el duplicado) y después el CONTEO, que ya incluye el turno
  // nuevo: si se pasa del tope, se lanza el error y la transacción se deshace entera (el alta también).
  async save({ maxPendientes, ...data }) {
    const creado = await traducirDuplicado(() =>
      sequelize.transaction({ type: Transaction.TYPES.IMMEDIATE }, async (t) => {
        const turno = await TurnoModel.create(data, { transaction: t });
        if (maxPendientes !== undefined) {
          const pendientes = await TurnoModel.count({
            where: { clienteId: data.clienteId, estado: PENDIENTE },
            transaction: t,
          });
          if (pendientes > maxPendientes) {
            throw new AppError("LIMITE_TURNOS_PENDIENTES", `Un cliente puede tener hasta ${maxPendientes} turnos pendientes`, 409);
          }
        }
        return turno;
      })
    );
    return creado.get({ plain: true });
  }

  async update(id, cambios) {
    const turno = await TurnoModel.findByPk(id);
    if (!turno) return null;
    // Un cambio de patente o de estado también puede chocar con el índice único
    await traducirDuplicado(() => turno.update(cambios));
    return turno.get({ plain: true });
  }

  // Clase 13 — R4: reprograma en UN solo UPDATE condicional: solo si sigue pendiente y nadie lo reprogramó
  // en el medio (reprogramacionesPrevias = lo que leyó el caso de uso). Mira y escribe en un paso: sin carrera.
  async reprogramar(id, { fecha, reprogramacionesPrevias }) {
    const [afectados] = await TurnoModel.update(
      { fecha, reprogramaciones: literal("reprogramaciones + 1") },
      { where: { id, estado: PENDIENTE, reprogramaciones: reprogramacionesPrevias } }
    );
    return afectados === 0 ? null : this.getById(id);
  }

  async delete(id) {
    const borrados = await TurnoModel.destroy({ where: { id } });
    return borrados > 0;
  }

  // Borra todos los turnos de un cliente. Devuelve cuántos borró.
  async deleteByClienteId(clienteId) {
    return TurnoModel.destroy({ where: { clienteId } });
  }
}