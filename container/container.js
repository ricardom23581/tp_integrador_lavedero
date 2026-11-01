/**
 * Composition root: arma las dependencias de la app.
 * Cadena: DAO (elegido por la factory) → casos de uso → controller → router.
 * Es async porque los DAOs de Sequelize necesitan init() (crear tablas y seed).
 */
import { Router } from "express";
import { getTurnosDao, getUsuariosDao } from "../dao/daoFactory.js";
import makeTurnoUseCases from "../usecases/turnos/makeTurnoUseCases.js";
import makeUsuarioUseCases from "../usecases/usuarios/makeUsuarioUseCases.js";
import { makeTurnosController } from "../controllers/turnosController.js";
import { makeUsuariosController } from "../controllers/usuariosController.js";
import { crearTurnosRouter } from "../routes/turnosRoutes.js";
import { crearUsuariosRouter } from "../routes/usuariosRoutes.js";

export async function crearContainer() {
  const daos = {
    usuariosDao: await getUsuariosDao(),
    turnosDao: await getTurnosDao(),
  };

  // Los DAOs en memoria no tienen init(); los de Sequelize sí.
  // Usuarios primero: los turnos dependen de ellos.
  await daos.usuariosDao.init?.();
  await daos.turnosDao.init?.();

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