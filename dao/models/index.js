/**
 * Punto único de modelos y asociaciones (evita dependencias circulares).
 * Relación 1:N → un Usuario tiene muchos Turnos; un Turno pertenece a un Usuario.
 */
import sequelize from "../../connection/sequelize.js";
import UsuarioModel from "./UsuarioModel.js";
import TurnoModel from "./TurnoModel.js";

UsuarioModel.hasMany(TurnoModel, { foreignKey: "clienteId", as: "turnos" });
TurnoModel.belongsTo(UsuarioModel, { foreignKey: "clienteId", as: "cliente" });

export { sequelize, UsuarioModel, TurnoModel };