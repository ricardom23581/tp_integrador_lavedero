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
        // Hash bcrypt de la contraseña (nunca la contraseña en texto plano). Los DAOs no lo devuelven
    // en las lecturas comunes: solo getCredentialsByEmail lo expone, para el login.
    passwordHash: { type: DataTypes.STRING(100), allowNull: false },
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