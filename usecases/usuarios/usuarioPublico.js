/**
 * Saca el password antes de devolver un usuario hacia afuera (HTTP).
 * Acepta null para encadenar con resultados que pueden no existir.
 */
export default function usuarioPublico(usuario) {
  if (!usuario) return null;
  const { password, ...publico } = usuario; // eslint-disable-line no-unused-vars
  return publico;
}