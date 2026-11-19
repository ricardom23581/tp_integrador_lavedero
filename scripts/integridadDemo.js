// scripts/integridadDemo.js — Ejercicio 6 (Clase 13): node --env-file=.env scripts/integridadDemo.js
// Prueba la "última línea de defensa" directamente contra los DAOs (sin pasar por el caso de uso):
//   6.3 el índice único parcial existe en la base SQLite
//   6.5 dos save() EN PARALELO con el mismo cliente y la misma patente: uno se crea, el otro falla con
//       PATENTE_CON_TURNO_PENDIENTE (Sequelize y memoria)
//   6.4 cuando el turno se atiende, la misma patente puede volver a sacar turno (el índice es parcial)
// IMPORTANTE: pará el servidor antes de correrlo (usa el mismo archivo .sqlite de SQLITE_STORAGE).
// Este script NO es un caso de uso: no aplica reglas, solo prueba los DAOs.
import { sequelize, UsuarioModel, TurnoModel } from "../dao/models/index.js";
import TurnosSequelizeDao from "../dao/sequelize/TurnosSequelizeDao.js";
import TurnosMemoryDao from "../dao/memory/TurnosMemoryDao.js";

const PENDIENTE = "Esperando el servicio";

function mostrar(resultados) {
  resultados.forEach((r, i) => {
    if (r.status === "fulfilled") console.log(`  Pedido ${i + 1}: creado (turno id ${r.value.id})`);
    else console.log(`  Pedido ${i + 1}: rechazado → ${r.reason.code ?? r.reason.name} (${r.reason.statusCode ?? "-"})`);
  });
}

async function conSequelize() {
  console.log("== Sequelize (SQLite) ==");
  await UsuarioModel.sync();
  await TurnoModel.sync();

  // 6.3: el índice tiene que estar en sqlite_master con su WHERE
  const [indices] = await sequelize.query(
    "SELECT sql FROM sqlite_master WHERE type = 'index' AND tbl_name = 'turnos' AND sql IS NOT NULL"
  );
  console.log("6.3 Índices de la tabla turnos:");
  indices.forEach((i) => console.log("  ", i.sql));
  if (!indices.some((i) => /UNIQUE/i.test(i.sql) && /WHERE/i.test(i.sql) && /estado/i.test(i.sql))) {
    console.log("  ⚠ No aparece el índice único parcial: borrá la carpeta data/ y volvé a arrancar el servidor.");
  }

  // Datos propios para no depender de lo que haya en la base
  const marca = Date.now();
  const cliente = await UsuarioModel.create({ nombre: "Carrera", email: `carrera${marca}@test.com`, rol: "user", passwordHash: "x" });
  const dao = new TurnosSequelizeDao();
  const datos = { clienteId: cliente.id, patente: "AA000AA", fecha: "2026-12-02T10:00", tipoVehiculo: "auto", estado: PENDIENTE };

  // 6.5: dos altas simultáneas, sin pasar por el caso de uso
  console.log(`6.5 Dos save() en paralelo (cliente ${cliente.id}, patente ${datos.patente}):`);
  const resultados = await Promise.allSettled([dao.save(datos), dao.save(datos)]);
  mostrar(resultados);
  const pendientes = await dao.getAll({ clienteId: cliente.id, estado: PENDIENTE });
  console.log(`  Turnos pendientes de esa patente: ${pendientes.length} (esperado 1)`);

  // 6.4: se atiende el turno y la patente vuelve a sacar uno
  const creado = resultados.find((r) => r.status === "fulfilled").value;
  await dao.update(creado.id, { estado: "Lavado finalizado" });
  const otraVez = await dao.save({ ...datos, fecha: "2026-12-03T10:00" });
  console.log(`6.4 Atendido y pedido de nuevo: creado (turno id ${otraVez.id}) (el índice es parcial)`);
}

async function enMemoria() {
  console.log("\n== Memoria ==");
  const dao = new TurnosMemoryDao();
  const datos = { clienteId: 1, patente: "AA000AA", fecha: "2026-12-02T10:00", tipoVehiculo: "auto", estado: PENDIENTE };
  console.log("6.5 Dos save() en paralelo (cliente 1, patente AA000AA):");
  mostrar(await Promise.allSettled([dao.save(datos), dao.save(datos)]));
}

try {
  await conSequelize();
  await enMemoria();
} finally {
  await sequelize.close();
}