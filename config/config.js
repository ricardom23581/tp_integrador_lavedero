/**
 * Configuración central de la aplicación.
 * Lee las variables de entorno y define valores por defecto.
 */
const config = {
  port: Number(process.env.PORT) || 3000,
  persistenceType: process.env.PERSISTENCE_TYPE || "memory",
};

export default config;

