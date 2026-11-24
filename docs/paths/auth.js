import { loginSchema, registerSchema, cambiarPasswordSchema } from "../../schemas/authSchema.js";
import { LoginResponse } from "../responseSchemas.js";
import { operation, ref, json } from "../operation.js";

const authPaths = {
  "/auth/register": {
    post: operation({
      tag: "Autenticación",
      id: "registrarUsuario",
      summary: "Registrar una cuenta",
      description: "El registro público siempre crea un usuario con rol `user`.",
      body: registerSchema,
      bodyExample: { nombre: "Ana Pérez", email: "ana@example.com", password: "ClaveSegura123" },
      responses: { "201": json("Usuario registrado", ref("Usuario")) },
      errors: ["EMAIL_DUPLICADO"],
    }),
  },
  "/auth/login": {
    post: operation({
      tag: "Autenticación",
      id: "iniciarSesion",
      summary: "Iniciar sesión",
      description: "Devuelve un JWT. En Swagger UI, usá **Authorize** y pegá el token sin el prefijo `Bearer`.",
      body: loginSchema,
      bodyExample: { email: "admin@lavadero.com", password: "<contraseña configurada>" },
      responses: { "200": json("Sesión iniciada", ref("LoginResponse")) },
      errors: ["CREDENCIALES_INVALIDAS", "DEMASIADOS_INTENTOS"],
    }),
  },
  "/auth/me": {
    get: operation({
      tag: "Autenticación",
      id: "obtenerPerfil",
      summary: "Obtener el perfil propio",
      auth: "user",
      responses: { "200": json("Usuario autenticado", ref("Usuario")) },
      errors: ["USUARIO_NO_ENCONTRADO"],
    }),
  },
  "/auth/password": {
    put: operation({
      tag: "Autenticación",
      id: "cambiarPassword",
      summary: "Cambiar la contraseña propia",
      auth: "user",
      body: cambiarPasswordSchema,
      bodyExample: { passwordActual: "ClaveActual123", passwordNueva: "ClaveNueva456" },
      responses: { "204": { description: "Contraseña actualizada; no devuelve body." } },
      errors: ["CREDENCIALES_INVALIDAS", "USUARIO_NO_ENCONTRADO"],
    }),
  },
};

export default authPaths;
