/**
 * DAO de usuarios en memoria (array de JavaScript).
 * Misma interfaz que tendrá el DAO de Sequelize. Devuelve copias.
 * Guarda passwordHash pero NUNCA lo devuelve, salvo en getCredentialsByEmail (para el login).
 */
export default class UsuariosMemoryDao {
  #usuarios = [];
  #nextId = 1;

  constructor(seed = []) {
    seed.forEach((u) => this.#usuarios.push({ id: this.#nextId++, ...u }));
  }

  // Copia del usuario sin el hash de la contraseña
  #publico({ passwordHash: _oculto, ...usuario }) {
    return usuario;
  }

  async getAll() {
    return this.#usuarios.map((u) => this.#publico(u));
  }

 async getById(id) {
    const usuario = this.#usuarios.find((u) => u.id === id);
    return usuario ? this.#publico(usuario) : null;
  }

 async getByEmail(email) {
    const usuario = this.#usuarios.find((u) => u.email === email);
    return usuario ? this.#publico(usuario) : null;
  }

  // Credenciales para el login: es el ÚNICO método que devuelve el hash de la contraseña
  async getCredentialsByEmail(email) {
    const usuario = this.#usuarios.find((u) => u.email === email);
    return usuario ? { ...usuario } : null;
  }

  async save(data) {
    const nuevo = { id: this.#nextId++, ...data };
    this.#usuarios.push(nuevo);
    return { ...nuevo };
  }

  async update(id, cambios) {
    const index = this.#usuarios.findIndex((u) => u.id === id);
    if (index === -1) return null;
    this.#usuarios[index] = { ...this.#usuarios[index], ...cambios, id };
    return { ...this.#usuarios[index] };
  }

  async delete(id) {
    const index = this.#usuarios.findIndex((u) => u.id === id);
    if (index === -1) return false;
    this.#usuarios.splice(index, 1);
    return true;
  }
}