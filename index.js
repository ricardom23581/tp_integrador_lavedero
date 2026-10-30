/**
 * Punto de entrada: crea la app Express, monta el router del contenedor y levanta el servidor.
 */
import express from "express";
import config from "./config/config.js";
import { crearContainer } from "./container/container.js";

const container = crearContainer();
const app = express();

app.use(express.json()); // sin esto, req.body es undefined

app.get("/health", (req, res) => {
  res.json({ status: "ok", persistence: config.persistenceType });
});

app.use("/api", container.router);

app.listen(config.port, () => {
  console.log(`Servidor en http://localhost:${config.port} (${config.persistenceType})`);
});