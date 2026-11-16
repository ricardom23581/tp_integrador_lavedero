/**
 * Rutas de autenticación: /register y /login son públicas; /me exige token.
 */
import { Router } from "express";
import validate from "../middlewares/validate.js";
import { registerSchema, loginSchema } from "../schemas/authSchema.js";

export function crearAuthRouter(controller, { authenticate }) {
  const router = Router();

  router.post("/register", validate(registerSchema), controller.register);
  router.post("/login", validate(loginSchema), controller.login);
  router.get("/me", authenticate, controller.me);

  return router;
}