/**
 * Composition root: arma las dependencias de la app.
 * Cadena: DAO (elegido por la factory) → casos de uso → controller → router.
 * Es async porque los DAOs de Sequelize necesitan init() (crear tablas y seed).
 */
import { Router } from "express";
import config from "../config/config.js";
import { makeEventBus } from "../events/eventBus.js";
import { registerTurnoListeners } from "../events/turnoListeners.js";
import { makeNotifier } from "../notifiers/notifierFactory.js";
import { makePasswordHasher } from "../security/passwordHasher.js";
import { makeTokenService } from "../security/tokenService.js";
import { makeAuthMiddlewares } from "../middlewares/auth.js";
import { getTurnosDao, getUsuariosDao } from "../dao/daoFactory.js";
import makeTurnoUseCases from "../usecases/turnos/makeTurnoUseCases.js";
import makeUsuarioUseCases from "../usecases/usuarios/makeUsuarioUseCases.js";
import makeAuthUseCases from "../usecases/auth/makeAuthUseCases.js";
import { makeTurnosController } from "../controllers/turnosController.js";
import { makeUsuariosController } from "../controllers/usuariosController.js";
import { makeAuthController } from "../controllers/authController.js";
import { crearTurnosRouter } from "../routes/turnosRoutes.js";
import { crearUsuariosRouter } from "../routes/usuariosRoutes.js";
import { crearAuthRouter } from "../routes/authRoutes.js";

import seedAdmin from "../usecases/auth/seedAdmin.js";
// Clase 12: calendario de feriados (API externa)
import { getCalendario } from "../gateways/calendarioFactory.js";
import makeFeriadoUseCases from "../usecases/feriados/makeFeriadoUseCases.js";
import { makeFeriadosController } from "../controllers/feriadosController.js";
import { crearFeriadosRouter } from "../routes/feriadosRoutes.js";
// Clase 13: reloj inyectable y caché de feriados para las reglas de turnos
import { createClock } from "../utils/clock.js";
import { conCachePorAnio } from "../gateways/calendarioConCache.js";

export async function crearContainer() {
  // Seguridad: el hasher se crea primero porque el seed de usuarios necesita guardar hashes.
  const hasher = makePasswordHasher({ rounds: config.bcryptRounds });
  const tokens = makeTokenService(config.jwt);
  const auth = makeAuthMiddlewares(tokens); // { authenticate, authorize }

  const daos = {
    usuariosDao: await getUsuariosDao({ hasher }),
    turnosDao: await getTurnosDao(),
  };

  // Los DAOs en memoria no tienen init(); los de Sequelize sí.
  // Usuarios primero: los turnos dependen de ellos.
  await daos.usuariosDao.init?.();
  await daos.turnosDao.init?.();
  await seedAdmin(config.admin, daos.usuariosDao, hasher);

  // Eventos: el bus conecta a quien emite (casos de uso) con quien escucha (listeners).
  // Los listeners se registran ANTES de recibir requests para no perder ningún evento.
  const events = makeEventBus();
  const notifier = makeNotifier(config.notifier);
  registerTurnoListeners(events, notifier);

    // Calendario de feriados: real (ArgentinaDatos) o falso según config. Se crea UNA sola vez
  // y se comparte entre turnos y feriados. Timeout y concurrencia llegan por inyección.
  const calendario = getCalendario(config.calendario);

  // Clase 13: reloj (real o fijo para "viajar en el tiempo") y calendario CON caché para las reglas de turnos.
  // /api/feriados/verificar sigue usando el calendario SIN caché (para comparar los modos de la clase 12).
  const clock = createClock({ fixedNow: config.clockNow });
  if (config.clockNow) console.log(`[Reloj] Fijo en ${config.clockNow} (ahora en el lavadero = ${clock.ahora()})`);
  const calendarioConCache = conCachePorAnio(calendario);

  const useCases = {
    turnos: makeTurnoUseCases({
      turnosDao: daos.turnosDao,
      usuariosDao: daos.usuariosDao,
      events,
      calendario: calendarioConCache,
      clock,
      reglas: config.reglas,
    }),
    usuarios: makeUsuarioUseCases(daos.usuariosDao, daos.turnosDao, hasher),
    auth: makeAuthUseCases(daos.usuariosDao, hasher, tokens),
    feriados: makeFeriadoUseCases(calendario, { concurrency: config.calendario.concurrency }),
  };

  const controllers = {
    turnos: makeTurnosController(useCases.turnos),
    usuarios: makeUsuariosController(useCases.usuarios),
    auth: makeAuthController(useCases.auth),
    feriados: makeFeriadosController(useCases.feriados),
  };

  const router = Router();
  router.use("/auth", crearAuthRouter(controllers.auth, auth, config.loginRateLimitMax));
  router.use("/turnos", crearTurnosRouter(controllers.turnos, auth));
  router.use("/usuarios", crearUsuariosRouter(controllers.usuarios, auth));
  router.use("/feriados", crearFeriadosRouter(controllers.feriados, auth));

  return { daos, events, useCases, controllers, router };
}