import { DataTypes, Model } from "sequelize";
import sequelize from "../../connection/sequelize.js";

class UsuarioModel extends Model {}

UsuarioModel.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(80), allowNull: false },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: { type: DataTypes.STRING(100), allowNull: false },
    rol: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "user",
      validate: { isIn: [["admin", "user"]] },
    },
  },
  {
    sequelize,
    modelName: "Usuario",
    tableName: "usuarios",
    // Sin createdAt/updatedAt: así los objetos planos tienen exactamente
    // los mismos campos que en memoria y ambos modos responden igual.
    timestamps: false,
  }
);

export default UsuarioModel;