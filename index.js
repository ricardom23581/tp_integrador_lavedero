/**
 * Punto de entrada: crea la app Express y levanta el servidor.
 */
import express from "express";
import config from "./config/config.js";
import { crearContainer } from "./container/container.js";

const container = crearContainer();
const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", persistence: config.persistenceType });
});

// Acá después se montan los routers:
// app.use("/api/clientes", crearClientesRouter(container.controllers.clientes));

app.listen(config.port, () => {
  console.log(`Servidor en http://localhost:${config.port} (${config.persistenceType})`);
});