/**
 * Factory de DAOs: según PERSISTENCE_TYPE devuelve el adaptador de cada entidad.
 * Todos los adaptadores de una entidad cumplen la misma interfaz, así que
 * cambiar de persistencia no obliga a tocar casos de uso, controllers ni rutas.
 *
 * Los DAOs de Sequelize se importan con import() dinámico: así, en modo memoria
 * nunca se carga Sequelize ni se crea el archivo .sqlite.
 */
import config from "../config/config.js";
import TurnosMemoryDao from "./memory/TurnosMemoryDao.js";
import UsuariosMemoryDao from "./memory/UsuariosMemoryDao.js";
import { turnosSeed, usuariosSeedConHash } from "./memory/seed.js";

const tipoInvalido = (tipo) => new Error(`PERSISTENCE_TYPE inválido: ${tipo}`);

export async function getTurnosDao() {
  const tipo = config.persistenceType;
  if (tipo === "memory") return new TurnosMemoryDao(turnosSeed);
  if (tipo === "sequelize") {
    const { default: TurnosSequelizeDao } = await import("./sequelize/TurnosSequelizeDao.js");
    return new TurnosSequelizeDao(turnosSeed);
  }
  throw tipoInvalido(tipo);
}

// Recibe el hasher porque el seed de usuarios necesita guardar contraseñas hasheadas.
export async function getUsuariosDao({ hasher }) {
  const tipo = config.persistenceType;
  if (tipo === "memory") return new UsuariosMemoryDao(await usuariosSeedConHash(hasher));
  if (tipo === "sequelize") {
    const { default: UsuariosSequelizeDao } = await import("./sequelize/UsuariosSequelizeDao.js");
    return new UsuariosSequelizeDao(await usuariosSeedConHash(hasher));
  }
  throw tipoInvalido(tipo);
}
