/**
 * Hasheador de contraseñas. Contrato que usan los casos de uso: hash() y compare().
 * Hoy se implementa con bcryptjs, pero los casos de uso no lo saben (igual que con el DAO).
 *
 * bcrypt genera un "salt" aleatorio en cada hash y lo guarda dentro del propio resultado.
 * Por eso la misma contraseña hasheada dos veces da resultados distintos, y aun así compare()
 * funciona con ambos: lee el salt del hash guardado y repite el cálculo.
 */
import bcrypt from "bcryptjs";

export function makePasswordHasher({ rounds }) {
  return {
    hash: (plain) => bcrypt.hash(plain, rounds),
    compare: (plain, hash) => bcrypt.compare(plain, hash),
  };
}