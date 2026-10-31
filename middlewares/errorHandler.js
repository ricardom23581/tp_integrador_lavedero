/**
 * Manejo de errores centralizado. Express lo reconoce por tener 4 parámetros.
 * Va registrado al final de todo en index.js.
 */
import AppError from "../errors/AppError.js";

// eslint-disable-next-line no-unused-vars
export default function errorHandler(err, req, res, next) {
  // 1) Error esperado: lo tiramos nosotros con AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details }),
      },
    });
  }

  // 2) JSON mal formado en el body: lo tira express.json() antes de llegar a las rutas
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      error: { code: "JSON_INVALIDO", message: "El body no es un JSON válido" },
    });
  }

  // 3) Inesperado (bug): log completo para nosotros, mensaje genérico para el cliente
  console.error("Error no controlado:", err);
  res.status(500).json({
    error: { code: "ERROR_INTERNO", message: "Ocurrió un error inesperado en el servidor" },
  });
}