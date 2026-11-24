import { jsonSchema } from "./zodToOpenApi.js";
import * as responseSchemas from "./responseSchemas.js";
import authPaths from "./paths/auth.js";
import turnosPaths from "./paths/turnos.js";
import usuariosPaths from "./paths/usuarios.js";
import feriadosPaths from "./paths/feriados.js";

function buildOpenApiSpec({ serverUrl = "/api" } = {}) {
  const schemas = Object.fromEntries(
    Object.entries(responseSchemas).map(([name, schema]) => [name, jsonSchema(schema)])
  );

  return {
    openapi: "3.1.0",
    info: {
      title: "Lavadero API",
      version: "1.0.0",
      description: [
        "API REST para administrar turnos, usuarios y consultar feriados.",
        "",
        "**Autenticación:** `POST /auth/login` devuelve un JWT para enviar como `Authorization: Bearer <token>`.",
        "",
        "**Errores:** el formato es `{ error: { code, message, details? } }`. `code` es estable; `message` es para personas.",
        "Una ruta inexistente responde `404 RUTA_NO_ENCONTRADA`.",
      ].join("\n"),
    },
    servers: [{ url: serverUrl, description: "Este servidor; la API está montada bajo /api" }],
    tags: [
      { name: "Autenticación", description: "Registro, inicio de sesión y administración de la cuenta propia." },
      { name: "Turnos", description: "Consulta, creación, reprogramación y administración de turnos." },
      { name: "Usuarios", description: "Administración de usuarios (solo administradores)." },
      { name: "Feriados", description: "Consulta de feriados por fecha usando el calendario configurado." },
    ],
    paths: { ...authPaths, ...turnosPaths, ...usuariosPaths, ...feriadosPaths },
    components: {
      schemas,
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "El token que devuelve `POST /auth/login`.",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  };
}

export default buildOpenApiSpec;
