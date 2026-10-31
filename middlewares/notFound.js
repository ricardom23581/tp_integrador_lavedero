/**
 * notFound: se registra después de todas las rutas.
 * Si un request llegó hasta acá, ninguna ruta matcheó → le pasa un AppError 404 al errorHandler.
 */
import AppError from "../errors/AppError.js";

export default function notFound(req, res, next) {
  next(
    new AppError(
      "RUTA_NO_ENCONTRADA",
      `No existe la ruta ${req.method} ${req.originalUrl}`,
      404
    )
  );
}