/**
 * Schemas de Zod para autenticación: registro y login.
 */
import { z } from "zod";
import { crearUsuarioSchema } from "./usuarioSchema.js";

// POST /api/auth/register — autoregistro público.
// Reusa el schema de crear usuario (nombre, email, password): no acepta "rol",
// así que quien se registra siempre es "user".
export const registerSchema = crearUsuarioSchema;

// POST /api/auth/login — el email se normaliza igual que al registrarse.
// La contraseña solo se exige "no vacía": las reglas de largo se aplican al crearla, no al
// iniciar sesión (si no, los usuarios de ejemplo con contraseña corta no podrían entrar).
export const loginSchema = z.object({
  email: z
    .string({ error: "El email es obligatorio" })
    .trim()
    .toLowerCase()
    .email("Email inválido"),
  password: z
    .string({ error: "La contraseña es obligatoria" })
    .min(1, "La contraseña es obligatoria"),
});

// PUT /api/auth/password — la nueva cumple las mismas reglas que al registrarse
export const cambiarPasswordSchema = z
  .object({
    passwordActual: z
      .string({ error: "La contraseña actual es obligatoria" })
      .min(1, "La contraseña actual es obligatoria"),
    passwordNueva: crearUsuarioSchema.shape.password,
  })
  .refine((d) => d.passwordActual !== d.passwordNueva, {
    message: "La contraseña nueva tiene que ser distinta de la actual",
    path: ["passwordNueva"],
  });