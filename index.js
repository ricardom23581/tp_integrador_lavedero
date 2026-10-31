/**
 * Punto de entrada: crea la app Express, registra los middlewares globales,
 * monta el router del contenedor y levanta el servidor.
 * El ORDEN de los app.use es el orden en que corren.
 */
import express from "express";
import config from "./config/config.js";
import { crearContainer } from "./container/container.js";
import logger from "./middlewares/logger.js";
import notFound from "./middlewares/notFound.js";

const container = crearContainer();
const app = express();

app.use(logger); // 1º: loguea todo, incluso lo que después da 404
app.use(express.json()); // 2º: parsea el body antes de que lo usen las rutas

app.get("/health", (req, res) => {
  res.json({ status: "ok", persistence: config.persistenceType });
});

app.use("/api", container.router); // 3º: las rutas de la API

app.use(notFound); // 4º: si nada matcheó → 404 en JSON

app.listen(config.port, () => {
  console.log(`Servidor en http://localhost:${config.port} (${config.persistenceType})`);
});