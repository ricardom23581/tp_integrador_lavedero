/**
 * DAO de usuarios con Sequelize. Misma interfaz que UsuariosMemoryDao.
 * Devuelve siempre objetos planos (raw / get({ plain: true })), nunca instancias del ORM.
 * Guarda passwordHash pero NUNCA lo devuelve, salvo en getCredentialsByEmail (para el login). 
*/
import { UsuarioModel } from "../models/index.js";

// Columnas pedidas explícitamente: sin "attributes", Sequelize hace SELECT * y traería
// passwordHash en cada lectura. Todas las lecturas comunes de este DAO usan esta lista.
const ATRIBUTOS_PUBLICOS = ["id", "nombre", "email", "rol"];

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
    return UsuarioModel.findAll({ attributes: ATRIBUTOS_PUBLICOS, raw: true, order: [["id", "ASC"]] });
  }


 async getById(id) {
    return UsuarioModel.findByPk(id, { attributes: ATRIBUTOS_PUBLICOS, raw: true });
  }

   async getByEmail(email) {
    return UsuarioModel.findOne({ where: { email }, attributes: ATRIBUTOS_PUBLICOS, raw: true });
  }

  // Credenciales para el login: es el ÚNICO método que devuelve el hash de la contraseña
  async getCredentialsByEmail(email) {
    return UsuarioModel.findOne({
      where: { email },
      attributes: [...ATRIBUTOS_PUBLICOS, "passwordHash"],
      raw: true,
    });
  }

    async save(data) {
    const creado = await UsuarioModel.create(data);
    // create() devuelve todo lo insertado (incluido el hash): se relee con las columnas públicas
    return this.getById(creado.id);
  }

  async update(id, cambios) {
    const usuario = await UsuarioModel.findByPk(id);
    if (!usuario) return null;
    await usuario.update(cambios);
    // La instancia trae el hash cargado: se relee con las columnas públicas
    return this.getById(id);
  }

  async delete(id) {
    const borrados = await UsuarioModel.destroy({ where: { id } });
    return borrados > 0;
  }
}