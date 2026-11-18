/**
 * Rutas de autenticación: /register y /login son públicas; /me y /password exigen token.
 */
import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import AppError from "../errors/AppError.js";
import validate from "../middlewares/validate.js";
import { registerSchema, loginSchema, cambiarPasswordSchema } from "../schemas/authSchema.js";

export function crearAuthRouter(controller, { authenticate }, maxIntentosLogin = 5) {
  const router = Router();

  // Freno a la fuerza bruta: por IP y por minuto, y solo cuentan los intentos FALLIDOS.
  // El error sale con el mismo formato que el resto de la API (lo responde el errorHandler).
  const loginLimiter = rateLimit({
    windowMs: 60_000,
    limit: maxIntentosLogin,
    skipSuccessfulRequests: true,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: (req, res, next) =>
      next(new AppError("DEMASIADOS_INTENTOS", "Demasiados intentos fallidos, probá de nuevo en un minuto", 429)),
  });

  router.post("/register", validate(registerSchema), controller.register);
  router.post("/login", loginLimiter, validate(loginSchema), controller.login);
  router.get("/me", authenticate, controller.me);
  router.put("/password", authenticate, validate(cambiarPasswordSchema), controller.cambiarPassword);

  return router;
}