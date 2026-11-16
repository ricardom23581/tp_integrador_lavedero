/**
 * Servicio de tokens JWT. Contrato: sign(payload) y verify(token).
 * sign() firma el payload con el secreto y le pone fecha de vencimiento.
 * verify() devuelve el payload si la firma es válida y no venció; si no, lanza un AppError 401.
 *
 * ¿Qué se ve en jwt.io sin conocer el secreto? Header y payload completos (sub, rol, iat, exp):
 * son solo base64, no están cifrados. ¿Qué no se puede hacer? Modificarlos y que el token siga
 * siendo válido, porque la firma dejaría de coincidir. La firma da integridad, no confidencialidad:
 * por eso en el payload no va nada sensible.
 */
import jwt from "jsonwebtoken";
import AppError from "../errors/AppError.js";

export function makeTokenService({ secret, expiresIn }) {
  return {
    sign: (payload) => jwt.sign(payload, secret, { expiresIn }),

    verify(token) {
      try {
        // Se fija el algoritmo: así nadie puede cambiarlo desde el header del token
        return jwt.verify(token, secret, { algorithms: ["HS256"] });
      } catch (err) {
        if (err.name === "TokenExpiredError") {
          throw new AppError("TOKEN_VENCIDO", "El token venció, iniciá sesión de nuevo", 401);
        }
        throw new AppError("TOKEN_INVALID", "Token inválido", 401);
      }
    },
  };
}