import { DataTypes, Model } from "sequelize";
import sequelize from "../../connection/sequelize.js";

class TurnoModel extends Model {}

TurnoModel.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    // La clave foránea clienteId se completa en dao/models/index.js (asociación)
    clienteId: { type: DataTypes.INTEGER, allowNull: false },
    patente: { type: DataTypes.STRING(7), allowNull: false },
    // Se guarda como texto "YYYY-MM-DDTHH:mm", tal como lo manda el front,
    // para que la respuesta sea idéntica a la de memoria.
    fecha: { type: DataTypes.STRING(16), allowNull: false },
    tipoVehiculo: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: { isIn: [["moto", "auto", "camioneta"]] },
    },
    estado: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "Esperando el servicio",
    },
  },
  {
    sequelize,
    modelName: "Turno",
    tableName: "turnos",
    timestamps: false,
  }
);

export default TurnoModel;