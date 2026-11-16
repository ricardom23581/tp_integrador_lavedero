/**
 * Saca el hash de la contraseña antes de devolver un usuario hacia afuera (HTTP).
 * Es una segunda barrera: los DAOs ya no lo devuelven, pero así un cambio futuro
 * en un DAO no puede filtrarlo por accidente.
 * Acepta null para encadenar con resultados que pueden no existir.
 */
export default function usuarioPublico(usuario) {
  if (!usuario) return null;
  const { passwordHash, ...publico } = usuario; // eslint-disable-line no-unused-vars
  return publico;
}