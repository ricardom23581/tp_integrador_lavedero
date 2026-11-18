/**
 * Caso de uso: sembrar el administrador inicial.
 * Corre al arrancar (lo llama el contenedor, después de inicializar los DAOs).
 * Si no existe un usuario con ADMIN_EMAIL, lo crea con ADMIN_PASSWORD hasheada.
 * Va directo al DAO porque createUsuario fuerza rol "user" y acá necesitamos "admin".
 */
async function seedAdmin({ email, password }, dao, hasher) {
  if (!password) {
    console.warn("[Seed] ADMIN_PASSWORD no está definida: no se crea el administrador inicial");
    return;
  }
  if (await dao.getByEmail(email)) return; // ya existe (por ejemplo, en la base SQLite)

  await dao.save({
    nombre: "Admin Lavadero",
    email,
    rol: "admin",
    passwordHash: await hasher.hash(password),
  });
  console.log(`[Seed] Administrador inicial creado (${email})`);
}

export default seedAdmin;