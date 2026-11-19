/**
 * Schemas de Zod para turnos: body (crear/actualizar), params (id) y query (listado).
 */
import { z } from "zod";
import { esHorarioDeAtencion } from "../utils/horario.js";

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

// "2026-02-30T10:00" tiene buen formato pero no existe: al convertirla y volver a texto tiene que dar lo mismo
const fechaExiste = (f) => {
  const d = new Date(`${f}:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 16) === f;
};

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
    // Clase 13: se compara ida y vuelta, porque new Date("2026-02-30T10:00") NO falla: lo corre al 2 de marzo
    .refine(fechaExiste, { message: "La fecha no existe", abort: true })
    // Clase 13 — R5: horario de atención. Va DESPUÉS del formato y de que la fecha exista.
    // Sigue siendo una validación de FORMA: se decide mirando solo el dato, sin consultar nada.
    .refine(esHorarioDeAtencion, "El lavadero atiende de 08:00 a 16:45, en turnos cada 15 minutos (:00, :15, :30, :45)"),
  tipoVehiculo: z.enum(TIPOS_VEHICULO, {
    error: `tipoVehiculo debe ser uno de: ${TIPOS_VEHICULO.join(", ")}`,
  }),
  estado: z.enum(ESTADOS_TURNO, {
    error: `estado debe ser uno de: ${ESTADOS_TURNO.join(", ")}`,
  }),
};

// POST /api/turnos — el estado no viene del cliente: lo fija el servidor
export const crearTurnoSchema = z.object({
  clienteId: campos.clienteId.optional(),
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

// PUT /api/turnos/:id/reprogramar (Clase 13, R4) — solo la nueva fecha
export const reprogramarTurnoSchema = z.object({
  fecha: campos.fecha,
});

// /:id — llega como string, coerce lo pasa a número
export const idParamSchema = z.object({
  id: z.coerce
    .number({ error: "El id debe ser un número" })
    .int("El id debe ser entero")
    .positive("El id debe ser positivo"),
});

// GET /api/turnos?... — filtros, orden y paginación
const filtrosListado = z.object({
  estado: campos.estado.optional(),
  tipoVehiculo: campos.tipoVehiculo.optional(),
  clienteId: z.coerce.number().int().positive().optional(),
  fecha: z.string().regex(REGEX_DIA, "fecha debe tener el formato YYYY-MM-DD").optional(),
  patente: z.string().trim().toUpperCase().optional(),
  // Clase 13: rango de días (inclusive en los dos extremos)
  desde: z.iso.date({ error: "desde debe tener el formato YYYY-MM-DD" }).optional(),
  hasta: z.iso.date({ error: "hasta debe tener el formato YYYY-MM-DD" }).optional(),
    // Ejercicio 9.2: solo "true" (turnos pendientes cuyo día ya pasó). "false" sería ambiguo: ¿pendientes o atendidos?
  ausentes: z.enum(["true"], { error: "ausentes solo admite 'true'" }).transform(() => true).optional(),
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

// Validación CRUZADA entre campos (Clase 13): cada fecha es válida por separado, pero la combinación puede no serlo.
// `refine` recibe el objeto completo ya parseado; `path` indica en qué campo se informa el error.
// Las cadenas AAAA-MM-DD se comparan con <= directamente porque ordenan igual que las fechas.
// (Se aplica aparte porque en Zod 4 un objeto con refine ya no se puede extender con .extend.)
const desdeNoPosteriorAHasta = [
  (q) => !q.desde || !q.hasta || q.desde <= q.hasta,
  { message: "'desde' no puede ser posterior a 'hasta'", path: ["desde"] },
];

export const listarTurnosQuerySchema = filtrosListado.refine(...desdeNoPosteriorAHasta);

// GET /api/turnos/export.csv (Clase 12) — los mismos filtros del listado + enriquecer + separador.
// limit por defecto 100 (en el listado es 20): un export suele querer más filas.
export const exportarTurnosQuerySchema = filtrosListado.extend({
  limit: z.coerce
    .number({ error: "limit debe ser un número" })
    .int()
    .positive("limit debe ser mayor a 0")
    .max(100, "limit no puede superar 100")
    .default(100),
  enriquecer: z
    .enum(["true", "false"], { error: "enriquecer debe ser 'true' o 'false'" })
    .transform((v) => v === "true")
    .optional(),
  separador: z.enum([",", ";"], { error: "separador debe ser ',' o ';'" }).default(","), // ";" para Excel en español
}).refine(...desdeNoPosteriorAHasta);