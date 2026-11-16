import AppError from "../../errors/AppError.js";

/**
 * Caso de uso: iniciar sesión.
 * Compara la contraseña recibida contra el hash guardado y, si coincide, firma un token JWT.
 *
 * El error es el MISMO si el email no existe o si la contraseña es incorrecta: así nadie puede
 * usar el login para averiguar qué emails están registrados.
 * Además, si el email no existe igual se ejecuta bcrypt contra un hash falso: sin eso la respuesta
 * sería mucho más rápida y, cronometrándola, se distinguiría "email inexistente" de "contraseña
 * incorrecta".
 */
async function loginUsuario({ email, password }, dao, hasher, tokens, hashFalso) {
  const credenciales = await dao.getCredentialsByEmail(email);
  const hashAComparar = credenciales?.passwordHash ?? (await hashFalso);
  const coincide = await hasher.compare(password, hashAComparar);

  if (!credenciales || !coincide) {
    throw new AppError("CREDENCIALES_INVALIDAS", "Email o contraseña incorrectos", 401);
  }

  // En el payload va lo mínimo (no es secreto: cualquiera puede leerlo).
  // "sub" es el estándar JWT para indicar quién es el dueño del token.
  const token = tokens.sign({ sub: String(credenciales.id), rol: credenciales.rol });

  return {
    token,
    usuario: {
      id: credenciales.id,
      nombre: credenciales.nombre,
      email: credenciales.email,
      rol: credenciales.rol,
    },
  };
}

export default loginUsuario;