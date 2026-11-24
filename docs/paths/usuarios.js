import {
  crearUsuarioSchema,
  actualizarUsuarioSchema,
  usuarioIdParamSchema,
  listarUsuariosQuerySchema,
} from "../../schemas/usuarioSchema.js";
import { operation, ref, arrayOf, json } from "../operation.js";

const totalCountHeader = {
  "X-Total-Count": {
    description: "Cantidad total de usuarios que coinciden con los filtros, antes de paginar.",
    schema: { type: "integer" },
  },
};

const usuariosPaths = {
  "/usuarios": {
    get: operation({
      tag: "Usuarios",
      id: "listarUsuarios",
      summary: "Listar usuarios",
      auth: "admin",
      query: listarUsuariosQuerySchema,
      responses: { "200": json("Usuarios de la página solicitada", arrayOf(ref("Usuario")), { headers: totalCountHeader }) },
    }),
    post: operation({
      tag: "Usuarios",
      id: "crearUsuario",
      summary: "Crear un usuario",
      auth: "admin",
      body: crearUsuarioSchema,
      bodyExample: { nombre: "Ana Pérez", email: "ana@example.com", password: "ClaveSegura123" },
      responses: { "201": json("Usuario creado; la contraseña no se incluye en la respuesta", ref("Usuario")) },
      errors: ["EMAIL_DUPLICADO"],
    }),
  },
  "/usuarios/{id}": {
    get: operation({
      tag: "Usuarios",
      id: "obtenerUsuario",
      summary: "Obtener un usuario",
      auth: "admin",
      params: usuarioIdParamSchema,
      responses: { "200": json("Usuario encontrado", ref("Usuario")) },
      errors: ["USUARIO_NO_ENCONTRADO"],
    }),
    put: operation({
      tag: "Usuarios",
      id: "actualizarUsuario",
      summary: "Actualizar un usuario",
      auth: "admin",
      params: usuarioIdParamSchema,
      body: actualizarUsuarioSchema,
      bodyExample: { nombre: "Ana Pérez" },
      responses: { "200": json("Usuario actualizado; la contraseña no se incluye en la respuesta", ref("Usuario")) },
      errors: ["USUARIO_NO_ENCONTRADO", "EMAIL_DUPLICADO"],
    }),
    delete: operation({
      tag: "Usuarios",
      id: "eliminarUsuario",
      summary: "Eliminar un usuario",
      auth: "admin",
      params: usuarioIdParamSchema,
      responses: { "204": { description: "Usuario eliminado; no devuelve body." } },
      errors: ["USUARIO_NO_ENCONTRADO", "ADMIN_NO_ELIMINABLE"],
    }),
  },
};

export default usuariosPaths;
