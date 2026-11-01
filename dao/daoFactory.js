/**
 * Factory de DAOs: según PERSISTENCE_TYPE devuelve el adaptador de cada entidad.
 * Todos los adaptadores de una entidad cumplen la misma interfaz, así que
 * cambiar de persistencia no obliga a tocar casos de uso, controllers ni rutas.
 */
import config from "../config/config.js";
import TurnosMemoryDao from "./memory/TurnosMemoryDao.js";
import UsuariosMemoryDao from "./memory/UsuariosMemoryDao.js";
import { turnosSeed, usuariosSeed } from "./memory/seed.js";

function persistenciaNoSoportada(tipo) {
  if (tipo === "sequelize") {
    return new Error("Persistencia sequelize todavía no implementada");
  }
  return new Error(`PERSISTENCE_TYPE inválido: ${tipo}`);
}

export function getTurnosDao() {
  const tipo = config.persistenceType;
  if (tipo === "memory") return new TurnosMemoryDao(turnosSeed);
  throw persistenciaNoSoportada(tipo);
}

export function getUsuariosDao() {
  const tipo = config.persistenceType;
  if (tipo === "memory") return new UsuariosMemoryDao(usuariosSeed);
  throw persistenciaNoSoportada(tipo);
}