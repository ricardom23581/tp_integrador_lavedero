/**
 * Composition root: arma las dependencias de la app.
 * Cadena: DAO (elegido por la factory) → casos de uso → controller → router.
 * Acá ya no se decide qué persistencia usar: eso lo resuelve dao/daoFactory.js.
 */
import { Router } from "express";
import { getTurnosDao, getUsuariosDao } from "../dao/daoFactory.js";
import makeTurnoUseCases from "../usecases/turnos/makeTurnoUseCases.js";
import makeUsuarioUseCases from "../usecases/usuarios/makeUsuarioUseCases.js";
import { makeTurnosController } from "../controllers/turnosController.js";
import { makeUsuariosController } from "../controllers/usuariosController.js";
import { crearTurnosRouter } from "../routes/turnosRoutes.js";
import { crearUsuariosRouter } from "../routes/usuariosRoutes.js";

export function crearContainer() {
  const daos = {
    turnosDao: getTurnosDao(),
    usuariosDao: getUsuariosDao(),
  };

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