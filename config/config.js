/**
 * Configuración central de la aplicación.
 * Lee las variables de entorno y define valores por defecto.
 */

// --- Seguridad (JWT) ---
// El secreto firma los tokens: quien lo conozca puede fabricar tokens válidos (incluso de admin).
// NO tiene valor por defecto a propósito: el código es público en git, y un default "para
// desarrollo" podría llegar a producción sin que nadie se entere. Mejor que falle al arrancar.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("Falta la variable de entorno JWT_SECRET (copiá .env.example a .env y completala)");
}

const config = {
  port: Number(process.env.PORT) || 3000,
  persistenceType: process.env.PERSISTENCE_TYPE || "memory",
  sqliteStorage: process.env.SQLITE_STORAGE || "./data/lavadero.sqlite",
 

  jwt: {
    secret: JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "1h", // vida del token: "15m", "1h", "7d"
  },
  
    bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 10, // costo del hash: cada +1 duplica el tiempo

  // Máximo de intentos de login FALLIDOS por IP y por minuto (los exitosos no cuentan)
  loginRateLimitMax: Number(process.env.LOGIN_RATE_LIMIT_MAX) || 5,

  // Administrador inicial: se siembra al arrancar si no existe. Sin ADMIN_PASSWORD no se crea.
  admin: {
    email: process.env.ADMIN_EMAIL || "admin@lavadero.com",
    password: process.env.ADMIN_PASSWORD,
  },

  // Notificador de eventos: console | file
  notifier: {
    type: process.env.NOTIFIER_TYPE || "console",
    filePath: process.env.NOTIFIER_FILE_PATH || "./logs/eventos.log",
  },

};

export default config;