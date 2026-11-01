/**
 * Conexión a la base de datos con Sequelize + SQLite.
 * Crea la carpeta del archivo .sqlite si no existe (SQLite no la crea sola).
 * Solo se importa cuando PERSISTENCE_TYPE=sequelize.
 */
import fs from "node:fs";
import path from "node:path";
import { Sequelize } from "sequelize";
import config from "../config/config.js";

fs.mkdirSync(path.dirname(config.sqliteStorage), { recursive: true });

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: config.sqliteStorage,
  logging: false,
});

export default sequelize;