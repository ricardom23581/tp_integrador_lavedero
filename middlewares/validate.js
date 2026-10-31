/**
 * Middleware de validación reutilizable.
 * validate(schema, "body" | "params" | "query") devuelve un middleware que valida esa parte del request.
 *
 * - body: se reemplaza req.body por los datos limpios.
 * - params y query: en Express 5 req.query es de solo lectura, así que los datos limpios
 *   se guardan en req.validated.params / req.validated.query.
 */
import AppError from "../errors/AppError.js";

export default function validate(schema, origen = "body") {
  return (req, res, next) => {
    const resultado = schema.safeParse(req[origen] ?? {});

    if (!resultado.success) {
      const details = resultado.error.issues.map((issue) => ({
        campo: issue.path.join(".") || "(raíz)",
        mensaje: issue.message,
      }));
      return next(new AppError("VALIDACION", `Datos inválidos en ${origen}`, 400, details));
    }

    req.validated = { ...req.validated, [origen]: resultado.data };
    if (origen === "body") req.body = resultado.data;
    next();
  };
}