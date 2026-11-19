// scripts/limitePendientesDemo.js — Ejercicio 9.1 (Clase 13): node --env-file=.env scripts/limitePendientesDemo.js
// R1 sin carrera: un cliente con 2 turnos pendientes hace 2 pedidos EN PARALELO (patentes distintas).
// El caso de uso cuenta 2 en los dos pedidos (2 < 3) y los dos pasan su chequeo: sin protección en el DAO,
// el cliente quedaría con 4. El índice único no sirve (son patentes distintas): el conteo y el alta tienen que
// ir en la MISMA transacción. Se prueba contra Sequelize y contra memoria, pasando por el caso de uso.
// IMPORTANTE: pará el servidor antes de correrlo (usa el mismo archivo .sqlite de SQLITE_STORAGE).
import { sequelize, UsuarioModel, TurnoModel } from "../dao/models/index.js";
import TurnosSequelizeDao from "../dao/sequelize/TurnosSequelizeDao.js";
import TurnosMemoryDao from "../dao/memory/TurnosMemoryDao.js";
import makeTurnoUseCases from "../usecases/turnos/makeTurnoUseCases.js";
import { makeEventBus } from "../events/eventBus.js";
import { createClock } from "../utils/clock.js";
import createFakeCalendario from "../gateways/fakeCalendario.js";

const ADMIN = { id: 0, rol: "admin" }; // actor: el admin puede sacar turnos a nombre de cualquiera
const reglas = { maxPendientes: 3, diasHabilesAnticipacion: 30, maxReprogramaciones: 1 };

function useCasesCon(turnosDao) {
  return makeTurnoUseCases({
    turnosDao,
    usuariosDao: { getById: async (id) => ({ id }) }, // alcanza con que el cliente "exista"
    events: makeEventBus(),
    calendario: createFakeCalendario({ latencyMs: 0 }),
    clock: createClock({ fixedNow: "2026-11-19T12:00:00Z" }),
    reglas,
  });
}

async function carrera(nombre, turnosDao, clienteId) {
  console.log(`== ${nombre} ==`);
  const useCases = useCasesCon(turnosDao);
  const turno = (patente, fecha) => ({ clienteId, patente, fecha, tipoVehiculo: "auto" });

  // Dos turnos previos, uno detrás del otro
  await useCases.createTurno(turno("AA111AA", "2026-12-01T10:00"), ADMIN);
  await useCases.createTurno(turno("AA222AA", "2026-12-01T10:15"), ADMIN);
  console.log(`Cliente ${clienteId} con 2 turnos pendientes. Dos pedidos en paralelo (patentes AA333AA y AA444AA):`);

  const resultados = await Promise.allSettled([
    useCases.createTurno(turno("AA333AA", "2026-12-01T10:30"), ADMIN),
    useCases.createTurno(turno("AA444AA", "2026-12-01T10:45"), ADMIN),
  ]);
  resultados.forEach((r, i) =>
    console.log(`  Pedido ${i + 1}: ${r.status === "fulfilled" ? `201 (turno id ${r.value.id})` : `${r.reason.statusCode} ${r.reason.code}`}`)
  );

  const pendientes = (await turnosDao.getAll({ clienteId, estado: "Esperando el servicio" })).length;
  console.log(`  Turnos pendientes al final: ${pendientes} ${pendientes <= reglas.maxPendientes ? "✔ (no supera el tope)" : "✘ ¡SUPERÓ EL TOPE!"}`);
}

try {
  await UsuarioModel.sync();
  await TurnoModel.sync();
  const marca = Date.now();
  const cliente = await UsuarioModel.create({ nombre: "Tope", email: `tope${marca}@test.com`, rol: "user", passwordHash: "x" });
  await carrera("Sequelize (SQLite)", new TurnosSequelizeDao(), cliente.id);
  console.log();
  await carrera("Memoria", new TurnosMemoryDao(), 500);
} finally {
  await sequelize.close();
}