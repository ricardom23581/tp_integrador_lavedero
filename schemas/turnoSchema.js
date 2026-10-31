/**
 * Schemas de Zod para turnos: body (crear/actualizar), params (id) y query (listado).
 */
import { z } from "zod";

export const TIPOS_VEHICULO = ["moto", "auto", "camioneta"];
export const ESTADOS_TURNO = [
  "Esperando el servicio",
  "En proceso de lavado",
  "Lavado finalizado",
];
const CAMPOS_ORDENABLES = ["id", "fecha", "patente", "estado", "tipoVehiculo"];

// Patente vieja (ABC123) o Mercosur (AB123CD)
const REGEX_PATENTE = /^([A-Z]{3}\d{3}|[A-Z]{2}\d{3}[A-Z]{2})$/;
// Fecha y hora como la manda el front: 2026-11-03T09:00
const REGEX_FECHA_HORA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const REGEX_DIA = /^\d{4}-\d{2}-\d{2}$/;

// Cada campo se define una sola vez y se reusa en crear y actualizar
const campos = {
  clienteId: z
    .number({
      error: (issue) =>
        issue.input === undefined ? "clienteId es obligatorio" : "clienteId debe ser un número",
    })
    .int("clienteId debe ser entero")
    .positive("clienteId debe ser positivo"),
  patente: z
    .string({ error: "La patente es obligatoria" })
    .trim()
    .toUpperCase()
    .regex(REGEX_PATENTE, "Patente inválida (formato ABC123 o AB123CD)"),
  fecha: z
    .string({ error: "La fecha es obligatoria" })
    .regex(REGEX_FECHA_HORA, {
      message: "La fecha debe tener el formato YYYY-MM-DDTHH:mm",
      abort: true, // si el formato está mal, no sigue con el refine
    })
    .refine((f) => !Number.isNaN(new Date(f).getTime()), "La fecha no existe"),
  tipoVehiculo: z.enum(TIPOS_VEHICULO, {
    error: `tipoVehiculo debe ser uno de: ${TIPOS_VEHICULO.join(", ")}`,
  }),
  estado: z.enum(ESTADOS_TURNO, {
    error: `estado debe ser uno de: ${ESTADOS_TURNO.join(", ")}`,
  }),
};

// POST /api/turnos — el estado no viene del cliente: lo fija el servidor
export const crearTurnoSchema = z.object({
  clienteId: campos.clienteId,
  patente: campos.patente,
  fecha: campos.fecha,
  tipoVehiculo: campos.tipoVehiculo,
});

// PUT /api/turnos/:id — todo opcional, pero al menos un campo
// (clienteId no se puede cambiar: un turno no pasa de un cliente a otro)
export const actualizarTurnoSchema = z
  .object({
    patente: campos.patente.optional(),
    fecha: campos.fecha.optional(),
    tipoVehiculo: campos.tipoVehiculo.optional(),
    estado: campos.estado.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Mandá al menos un campo para actualizar",
  });

// /:id — llega como string, coerce lo pasa a número
export const idParamSchema = z.object({
  id: z.coerce
    .number({ error: "El id debe ser un número" })
    .int("El id debe ser entero")
    .positive("El id debe ser positivo"),
});

// GET /api/turnos?... — filtros, orden y paginación
export const listarTurnosQuerySchema = z.object({
  estado: campos.estado.optional(),
  tipoVehiculo: campos.tipoVehiculo.optional(),
  clienteId: z.coerce.number().int().positive().optional(),
  fecha: z.string().regex(REGEX_DIA, "fecha debe tener el formato YYYY-MM-DD").optional(),
  patente: z.string().trim().toUpperCase().optional(),
  sort: z
    .enum([...CAMPOS_ORDENABLES, ...CAMPOS_ORDENABLES.map((c) => `-${c}`)], {
      error: `sort debe ser uno de: ${CAMPOS_ORDENABLES.join(", ")} (con - adelante para descendente)`,
    })
    .optional(),
  page: z.coerce
    .number({ error: "page debe ser un número" })
    .int()
    .positive("page debe ser mayor a 0")
    .default(1),
  limit: z.coerce
    .number({ error: "limit debe ser un número" })
    .int()
    .positive("limit debe ser mayor a 0")
    .max(100, "limit no puede superar 100")
    .default(20),
});