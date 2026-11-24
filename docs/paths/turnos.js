import {
  crearTurnoSchema,
  actualizarTurnoSchema,
  idParamSchema,
  listarTurnosQuerySchema,
  exportarTurnosQuerySchema,
  reprogramarTurnoSchema,
} from "../../schemas/turnoSchema.js";
import { TurnoDetalle } from "../responseSchemas.js";
import { operation, ref, arrayOf, json } from "../operation.js";

const totalCountHeader = {
  "X-Total-Count": {
    description: "Cantidad total de turnos que coinciden con los filtros, antes de paginar.",
    schema: { type: "integer" },
  },
};

const turnosPaths = {
  "/turnos": {
    get: operation({
      tag: "Turnos",
      id: "listarTurnos",
      summary: "Listar y filtrar turnos",
      description: "Los usuarios ven sus propios turnos; los administradores pueden consultar los de todos.",
      auth: "user",
      query: listarTurnosQuerySchema,
      responses: { "200": json("Turnos de la página solicitada", arrayOf(ref("Turno")), { headers: totalCountHeader }) },
      errors: ["PROHIBIDO"],
    }),
    post: operation({
      tag: "Turnos",
      id: "crearTurno",
      summary: "Crear un turno",
      description: "Un usuario crea turnos para sí mismo. Un administrador puede indicar `clienteId`.",
      auth: "user",
      body: crearTurnoSchema,
      bodyExample: {
        clienteId: 1,
        patente: "ABC123",
        fecha: "2026-12-10T09:30",
        tipoVehiculo: "auto",
      },
      responses: {
        "201": json("Turno creado", ref("Turno"), {
          headers: {
            Location: {
              description: "URL del turno recién creado.",
              schema: { type: "string", example: "/api/turnos/42" },
            },
          },
        }),
      },
      errors: [
        "PROHIBIDO",
        "USUARIO_NO_ENCONTRADO",
        "PATENTE_CON_TURNO_PENDIENTE",
        "CLIENTE_CON_AUSENCIAS",
        "LIMITE_TURNOS_PENDIENTES",
        "FECHA_PASADA",
        "FECHA_FUERA_DE_RANGO",
        "FECHA_FERIADO",
      ],
    }),
  },
  "/turnos/export.csv": {
    get: operation({
      tag: "Turnos",
      id: "exportarTurnosCsv",
      summary: "Exportar turnos a CSV",
      description: "La exportación es solo para administradores. `enriquecer` agrega información de feriados.",
      auth: "admin",
      query: exportarTurnosQuerySchema,
      responses: {
        "200": {
          description: "Archivo CSV descargable.",
          content: { "text/csv": { schema: { type: "string", example: "id,clienteId,patente,fecha\n1,2,ABC123,2026-12-10T09:30" } } },
          headers: {
            "Content-Disposition": { description: "Nombre del archivo descargado.", schema: { type: "string" } },
            "X-Enrichment": {
              description: "Estado del enriquecimiento: `ok`, `unavailable` o `skipped`.",
              schema: { type: "string", enum: ["ok", "unavailable", "skipped"] },
            },
          },
        },
      },
    }),
  },
  "/turnos/{id}": {
    get: operation({
      tag: "Turnos",
      id: "obtenerTurno",
      summary: "Obtener un turno",
      auth: "user",
      params: idParamSchema,
      responses: { "200": json("Turno encontrado", ref("Turno")) },
      errors: ["PROHIBIDO", "TURNO_NO_ENCONTRADO"],
    }),
    put: operation({
      tag: "Turnos",
      id: "actualizarTurno",
      summary: "Actualizar un turno",
      description: "Solo se pueden cambiar patente, fecha, tipo de vehículo o estado.",
      auth: "admin",
      params: idParamSchema,
      body: actualizarTurnoSchema,
      bodyExample: { estado: "En proceso de lavado" },
      responses: { "200": json("Turno actualizado", ref("Turno")) },
      errors: ["TURNO_NO_ENCONTRADO"],
    }),
    delete: operation({
      tag: "Turnos",
      id: "eliminarTurno",
      summary: "Eliminar un turno",
      auth: "admin",
      params: idParamSchema,
      responses: { "204": { description: "Turno eliminado; no devuelve body." } },
      errors: ["TURNO_NO_ENCONTRADO"],
    }),
  },
  "/turnos/{id}/detalle": {
    get: operation({
      tag: "Turnos",
      id: "obtenerDetalleTurno",
      summary: "Obtener turno y estado del feriado",
      description: "Si el calendario externo no responde, se devuelve el turno con `calendarioStatus: unavailable`.",
      auth: "user",
      params: idParamSchema,
      responses: { "200": json("Turno con información del calendario", ref("TurnoDetalle")) },
      errors: ["PROHIBIDO", "TURNO_NO_ENCONTRADO"],
    }),
  },
  "/turnos/{id}/reprogramar": {
    put: operation({
      tag: "Turnos",
      id: "reprogramarTurno",
      summary: "Reprogramar un turno",
      description: "El dueño del turno o un administrador pueden reprogramarlo si cumple las reglas de fecha.",
      auth: "user",
      params: idParamSchema,
      body: reprogramarTurnoSchema,
      bodyExample: { fecha: "2026-12-11T10:00" },
      responses: { "200": json("Turno reprogramado", ref("Turno")) },
      errors: [
        "TURNO_NO_ENCONTRADO",
        "PROHIBIDO",
        "TURNO_YA_ATENDIDO",
        "TURNO_AUSENTE",
        "CLIENTE_CON_AUSENCIAS",
        "LIMITE_REPROGRAMACIONES",
        "TURNO_CAMBIO",
        "FECHA_PASADA",
        "FECHA_FUERA_DE_RANGO",
        "FECHA_FERIADO",
      ],
    }),
  },
};

export default turnosPaths;
