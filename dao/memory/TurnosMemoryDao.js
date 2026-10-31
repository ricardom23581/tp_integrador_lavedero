/**
 * DAO de turnos en memoria (array de JavaScript).
 * Devuelve copias para que nadie modifique el array interno desde afuera.
 */
export default class TurnosMemoryDao {
  #turnos = [];
  #nextId = 1;

  constructor(seed = []) {
    seed.forEach((t) => this.#turnos.push({ id: this.#nextId++, ...t }));
  }

  async getAll() {
    return this.#turnos.map((t) => ({ ...t }));
  }

  async getById(id) {
    const turno = this.#turnos.find((t) => t.id === id);
    return turno ? { ...turno } : null;
  }

  async save(data) {
    const nuevo = { id: this.#nextId++, ...data };
    this.#turnos.push(nuevo);
    return { ...nuevo };
  }

  async update(id, cambios) {
    const index = this.#turnos.findIndex((t) => t.id === id);
    if (index === -1) return null;
    this.#turnos[index] = { ...this.#turnos[index], ...cambios, id };
    return { ...this.#turnos[index] };
  }

  async delete(id) {
    const index = this.#turnos.findIndex((t) => t.id === id);
    if (index === -1) return false;
    this.#turnos.splice(index, 1);
    return true;
  }
}