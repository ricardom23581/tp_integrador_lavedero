/**
 * Composition root: arma las dependencias de la app.
 * Cadena: DAO → casos de uso → controller → router.
 * Los casos de uso que cruzan entidades reciben los dos DAOs.
 */
import { Router } from "express";
import config from "../config/config.js";
import TurnosMemoryDao from "../dao/memory/TurnosMemoryDao.js";
import UsuariosMemoryDao from "../dao/memory/UsuariosMemoryDao.js";
import { turnosSeed, usuariosSeed } from "../dao/memory/seed.js";
import makeTurnoUseCases from "../usecases/turnos/makeTurnoUseCases.js";
import makeUsuarioUseCases from "../usecases/usuarios/makeUsuarioUseCases.js";
import { makeTurnosController } from "../controllers/turnosController.js";
import { makeUsuariosController } from "../controllers/usuariosController.js";
import { crearTurnosRouter } from "../routes/turnosRoutes.js";
import { crearUsuariosRouter } from "../routes/usuariosRoutes.js";

function crearDaos(tipo) {
  if (tipo === "memory") {
    return {
      turnosDao: new TurnosMemoryDao(turnosSeed),
      usuariosDao: new UsuariosMemoryDao(usuariosSeed),
    };
  }
  if (tipo === "sequelize") {
    throw new Error("Persistencia sequelize todavía no implementada");
  }
  throw new Error(`PERSISTENCE_TYPE inválido: ${tipo}`);
}

export function crearContainer() {
  const daos = crearDaos(config.persistenceType);

  const useCases = {
    turnos: makeTurnoUseCases(daos.turnosDao, daos.usuariosDao),
    usuarios: makeUsuarioUseCases(daos.usuariosDao, daos.turnosDao),
  };

  const controllers = {
    turnos: makeTurnosController(useCases.turnos),
    usuarios: makeUsuariosController(useCases.usuarios),
  };

  const router = Router();
  router.use("/turnos", crearTurnosRouter(controllers.turnos));
  router.use("/usuarios", crearUsuariosRouter(controllers.usuarios));

  return { daos, useCases, controllers, router };
}