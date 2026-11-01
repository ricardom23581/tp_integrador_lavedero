/**
 * DAO de usuarios con Sequelize. Misma interfaz que UsuariosMemoryDao.
 * Devuelve siempre objetos planos (raw / get({ plain: true })), nunca instancias del ORM.
 */
import { UsuarioModel } from "../models/index.js";

export default class UsuariosSequelizeDao {
  #seed;

  constructor(seed = []) {
    this.#seed = seed;
  }

  // Crea la tabla si no existe y carga el seed solo si está vacía.
  async init() {
    await UsuarioModel.sync();
    if ((await UsuarioModel.count()) === 0) {
      await UsuarioModel.bulkCreate(this.#seed);
    }
  }

  async getAll() {
    return UsuarioModel.findAll({ raw: true, order: [["id", "ASC"]] });
  }

  async getById(id) {
    return UsuarioModel.findByPk(id, { raw: true });
  }

  async getByEmail(email) {
    return UsuarioModel.findOne({ where: { email }, raw: true });
  }

  async save(data) {
    const creado = await UsuarioModel.create(data);
    return creado.get({ plain: true });
  }

  async update(id, cambios) {
    const usuario = await UsuarioModel.findByPk(id);
    if (!usuario) return null;
    await usuario.update(cambios);
    return usuario.get({ plain: true });
  }

  async delete(id) {
    const borrados = await UsuarioModel.destroy({ where: { id } });
    return borrados > 0;
  }
}