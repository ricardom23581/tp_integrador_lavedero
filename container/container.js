/**
 * Composition root: arma las dependencias de la app.
 * Según PERSISTENCE_TYPE elige qué DAO inyectar.
 */
import config from "../config/config.js";

function crearDaos(tipo) {
  if (tipo === "memory") {
    return {
      // clientesDao: new ClientesMemoryDao(),
      // obrasDao: new ObrasMemoryDao(),
    };
  }
  if (tipo === "sequelize") {
    throw new Error("Persistencia sequelize todavía no implementada");
  }
  throw new Error(`PERSISTENCE_TYPE inválido: ${tipo}`);
}

export function crearContainer() {
  const daos = crearDaos(config.persistenceType);

  // Acá después se agregan: casos de uso (reciben los daos)
  // y controllers (reciben los casos de uso)

  return { daos };
}