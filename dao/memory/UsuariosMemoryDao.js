/**
 * DAO de usuarios en memoria (array de JavaScript).
 * Misma interfaz que tendrá el DAO de Sequelize. Devuelve copias.
 * Acá SÍ está el password: lo necesita el login. Quien responde por HTTP lo saca.
 */
export default class UsuariosMemoryDao {
  #usuarios = [];
  #nextId = 1;

  constructor(seed = []) {
    seed.forEach((u) => this.#usuarios.push({ id: this.#nextId++, ...u }));
  }

  async getAll() {
    return this.#usuarios.map((u) => ({ ...u }));
  }

  async getById(id) {
    const usuario = this.#usuarios.find((u) => u.id === id);
    return usuario ? { ...usuario } : null;
  }

  async getByEmail(email) {
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