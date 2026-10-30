/**
 * Composition root: arma las dependencias de la app.
 * Según PERSISTENCE_TYPE elige qué DAO inyectar, y devuelve el router principal.
 */
import { Router } from "express";
import config from "../config/config.js";
import TurnosMemoryDao from "../dao/memory/TurnosMemoryDao.js";
import { turnosSeed } from "../dao/memory/seed.js";
import { makeTurnosController } from "../controllers/turnosController.js";
import { crearTurnosRouter } from "../routes/turnosRoutes.js";

function crearDaos(tipo) {
  if (tipo === "memory") {
    return {
      turnosDao: new TurnosMemoryDao(turnosSeed),
    };
  }
  if (tipo === "sequelize") {
    throw new Error("Persistencia sequelize todavía no implementada");
  }
  throw new Error(`PERSISTENCE_TYPE inválido: ${tipo}`);
}

export function crearContainer() {
  const daos = crearDaos(config.persistenceType);

  const controllers = {
    turnos: makeTurnosController(daos.turnosDao),
  };

  const router = Router();
  router.use("/turnos", crearTurnosRouter(controllers.turnos));

  return { daos, controllers, router };
}