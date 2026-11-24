import { z } from "zod";

const id = z.number().int().positive();
const Turno = z.strictObject({
  id,
  clienteId: id,
  patente: z.string(),
  fecha: z.string().meta({ description: "Fecha y hora local del lavadero: YYYY-MM-DDTHH:mm" }),
  tipoVehiculo: z.enum(["moto", "auto", "camioneta"]),
  estado: z.enum(["Esperando el servicio", "En proceso de lavado", "Lavado finalizado"]),
  reprogramaciones: z.number().int().min(0),
  situacion: z.enum(["pendiente", "ausente", "en proceso", "finalizado"]),
  diasAusente: z.number().int().min(0),
  feriadosDisponibles: z
    .boolean()
    .optional()
    .meta({ description: "Solo al crear o reprogramar. `false` indica que no se pudo consultar el calendario." }),
});

const Feriado = z.strictObject({
  fecha: z.iso.date(),
  nombre: z.string(),
  tipo: z.string().nullable(),
});

const TurnoDetalle = z.strictObject({
  ...Turno.shape,
  feriado: Feriado.nullable(),
  calendarioStatus: z.enum(["feriado", "habil", "unavailable"]),
});

const Usuario = z.strictObject({
  id,
  nombre: z.string(),
  email: z.email(),
  rol: z.enum(["admin", "user"]),
});

const LoginResponse = z.strictObject({
  token: z.string().meta({ description: "JWT para enviar como `Authorization: Bearer <token>`" }),
  usuario: Usuario,
});

const resultadoFeriado = z.union([
  z.strictObject({ fecha: z.iso.date(), status: z.literal("feriado"), feriado: Feriado }),
  z.strictObject({ fecha: z.iso.date(), status: z.literal("habil") }),
  z.strictObject({
    fecha: z.iso.date(),
    status: z.literal("failed"),
    error: z.strictObject({ code: z.string(), message: z.string() }),
  }),
]);

const VerificacionFeriados = z.strictObject({
  mode: z.enum(["sequential", "parallel", "limited", "batch"]),
  consultadas: z.number().int(),
  httpRequests: z.number().int().meta({ description: "Cantidad de pedidos realizados al calendario." }),
  elapsedMs: z.number().int(),
  resultados: z.array(resultadoFeriado),
});

const ErrorResponse = z.strictObject({
  error: z.strictObject({
    code: z.string().meta({ description: "Código estable para que el cliente decida qué hacer." }),
    message: z.string().meta({ description: "Texto para personas; no se recomienda usarlo para lógica." }),
    details: z
      .array(z.record(z.string(), z.unknown()))
      .optional()
      .meta({ description: "Detalles de cada campo inválido; aparece en errores `VALIDACION`." }),
  }),
});

export { Turno, TurnoDetalle, Usuario, LoginResponse, VerificacionFeriados, ErrorResponse };
