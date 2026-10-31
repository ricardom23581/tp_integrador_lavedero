/**
 * Error esperado (de negocio o del cliente) con su código HTTP.
 * Una sola clase para toda la app: lo que cambia entre recursos son los datos.
 */
export default class AppError extends Error {
  constructor(code, message, statusCode = 400, details = undefined) {
    super(message);
    this.name = "AppError";
    this.code = code; // ej: "TURNO_NO_ENCONTRADO"
    this.statusCode = statusCode; // ej: 404
    this.details = details; // opcional: detalle de validación
  }
}