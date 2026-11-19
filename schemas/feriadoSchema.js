/**
 * Schemas de Zod para la consulta de feriados (Clase 12).
 */
import { z } from "zod";

const REGEX_DIA = /^\d{4}-\d{2}-\d{2}$/;

// GET /api/feriados/verificar?fechas=2026-12-25,2026-12-26&mode=parallel
// fechas llega como texto separado por comas y se transforma en arreglo (sin repetidos)
export const verificarFeriadosQuerySchema = z.object({
  fechas: z
    .string({ error: "fechas es obligatorio (YYYY-MM-DD separadas por coma)" })
    .transform((value) => [...new Set(value.split(",").map((f) => f.trim()).filter(Boolean))])
    .pipe(
      z
        .array(z.string().regex(REGEX_DIA, "Cada fecha debe tener el formato YYYY-MM-DD"))
        .min(1, "Enviá al menos una fecha")
        .max(10, "Se pueden consultar hasta 10 fechas por pedido")
    ),
  mode: z
    .enum(["sequential", "parallel", "limited", "batch"], {
      error: "mode debe ser sequential, parallel, limited o batch",
    })
    .default("batch"),
});