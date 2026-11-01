/**
 * DAO de turnos con Sequelize. Misma interfaz que TurnosMemoryDao.
 * Devuelve siempre objetos planos, nunca instancias del ORM.
 */
import { TurnoModel } from "../models/index.js";

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

  async getAll() {
    return TurnoModel.findAll({ raw: true, order: [["id", "ASC"]] });
  }

  async getById(id) {
    return TurnoModel.findByPk(id, { raw: true });
  }

  async save(data) {
    const creado = await TurnoModel.create(data);
    return creado.get({ plain: true });
  }

  async update(id, cambios) {
    const turno = await TurnoModel.findByPk(id);
    if (!turno) return null;
    await turno.update(cambios);
    return turno.get({ plain: true });
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