import { randomBytes } from "node:crypto";
import loginUsuario from "./loginUsuario.js";
import registerUsuario from "./registerUsuario.js";
import cambiarPassword from "./cambiarPassword.js";
import getUsuarioById from "../usuarios/getUsuarioById.js";

/**
 * Factory de casos de uso de autenticación.
 * Recibe el DAO de usuarios, el hasher de contraseñas y el servicio de tokens.
 */
function makeAuthUseCases(usuariosDao, hasher, tokens) {
  // Hash falso con el mismo costo que los reales: así el login tarda parecido
  // cuando el email no existe. Se calcula una sola vez, al armar los casos de uso.
  const hashFalso = hasher.hash(randomBytes(16).toString("hex"));

  return {
    register: (data) => registerUsuario(data, usuariosDao, hasher),
    login: (credenciales) => loginUsuario(credenciales, usuariosDao, hasher, tokens, hashFalso),
    cambiarPassword: (id, data) => cambiarPassword(id, data, usuariosDao, hasher),
    // Perfil del usuario autenticado: devuelve el usuario sin hash, o null si ya no existe.
    getPerfil: (id) => getUsuarioById(id, usuariosDao),
  };
}

export default makeAuthUseCases;
