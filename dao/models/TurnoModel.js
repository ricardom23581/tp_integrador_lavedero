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
    // Clase 13 — R4: cuántas veces se reprogramó. "Ausente" NO se guarda: se calcula (ver domain/situacionTurno.js).
    reprogramaciones: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  {
    sequelize,
    modelName: "Turno",
    tableName: "turnos",
    timestamps: false,
    indexes: [
      // Clase 13 — última línea de defensa: un cliente no puede tener dos turnos PENDIENTES para el mismo vehículo.
      // El caso de uso ya lo chequea (PATENTE_CON_TURNO_PENDIENTE, buen mensaje), pero dos pedidos simultáneos
      // pueden pasar los dos el chequeo. El índice único PARCIAL (solo turnos "Esperando el servicio") hace que
      // la base rechace el segundo. Cuando el turno se atiende, la patente puede volver a sacar turno.
      // Si ya tenías la carpeta data/ de una clase anterior, borrala: sync() no agrega columnas ni índices.
      {
        name: "turnos_pendiente_cliente_patente",
        unique: true,
        fields: ["clienteId", "patente"],
        where: { estado: "Esperando el servicio" },
      },
    ],
  }
);

export default TurnoModel;