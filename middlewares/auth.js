/**
 * Middlewares de autenticación y autorización.
 * Se construyen con una factory porque necesitan el servicio de tokens (lo inyecta el contenedor).
 *
 *  - authenticate: ¿quién sos? Lee "Authorization: Bearer <token>", lo verifica y deja req.user.
 *  - authorize(...roles): ¿tenés permiso? Corta con 403 si el rol de req.user no está permitido.
 *
 * Limitación conocida: un token firmado sigue valiendo hasta que vence, aunque el usuario haya sido
 * eliminado o cambiado de rol. Se podría consultar la base en cada request, pero se perdería la
 * gracia de JWT (ya no sería "sin estado") y cada request pagaría una consulta. Alternativas: vida
 * corta del token, refresh tokens o una lista de tokens revocados.
 */
import AppError from "../errors/AppError.js";

export function makeAuthMiddlewares(tokens) {
  function authenticate(req, res, next) {
    const header = req.headers.authorization ?? "";
    const [esquema, token] = header.split(" ");

    if (esquema !== "Bearer" || !token) {
      return next(new AppError("TOKEN_FALTANTE", "Falta el header Authorization: Bearer <token>", 401));
    }

    try {
      const { sub, rol } = tokens.verify(token);
      // sub viaja como texto en el token; los ids de los DAOs son números
      req.user = { id: Number(sub), rol };
      next();
    } catch (err) {
      next(err); // ya es un AppError 401 (TOKEN_VENCIDO o TOKEN_INVALIDO)
    }
  }

  // Se usa después de authenticate. Si por error no hubiera req.user, deniega (más seguro).
  const authorize = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user?.rol)) {
      return next(new AppError("PROHIBIDO", "No tenés permiso para realizar esta acción", 403));
    }
    next();
  };

  return { authenticate, authorize };
}