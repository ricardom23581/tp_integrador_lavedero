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

    // Calendario de feriados (Clase 12): API externa (ArgentinaDatos) o uno falso para trabajar sin red
  calendario: {
    type: process.env.CALENDARIO_TYPE || "argentinadatos", // "argentinadatos", "fake" o "fake-down" (Clase 13: simula la API caída)
    baseUrl: process.env.FERIADOS_API_URL || "https://api.argentinadatos.com",
    timeoutMs: Number(process.env.EXTERNAL_TIMEOUT_MS) || 5000, // espera máxima por pedido externo
    concurrency: Number(process.env.EXTERNAL_CONCURRENCY) || 3, // pedidos externos simultáneos (modo "limited")
    fakeLatencyMs: Number(process.env.FAKE_LATENCY_MS) || 300, // demora simulada por pedido del calendario fake
  },

  // Reglas de negocio de turnos (Clase 13). Los números de las reglas son CONFIGURACIÓN, no código:
  // si el lavadero decide que el tope es 5, se cambia una variable de entorno sin tocar los casos de uso.
  reglas: {
    maxPendientes: Number(process.env.TURNOS_MAX_PENDIENTES) || 3, // R1: turnos pendientes por cliente
    diasHabilesAnticipacion: Number(process.env.TURNOS_DIAS_HABILES_ANTICIPACION) || 30, // R2: hasta cuándo se puede reservar
    maxReprogramaciones: Number(process.env.TURNOS_MAX_REPROGRAMACIONES ?? 1), // R4: reprogramaciones por turno
  },

  // Reloj fijo para "viajar en el tiempo" al probar a mano (ej. 2026-12-01T12:00:00Z). Vacío = hora real.
  clockNow: process.env.CLOCK_NOW || undefined,

  // Notificador de eventos: console | file
  notifier: {
    type: process.env.NOTIFIER_TYPE || "console",
    filePath: process.env.NOTIFIER_FILE_PATH || "./logs/eventos.log",
  },

};

export default config;