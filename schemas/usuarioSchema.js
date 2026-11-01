/**
 * Schemas de Zod para usuarios: body (crear/actualizar), params (id) y query (listado).
 * El rol NO viene del cliente: todo usuario registrado es "user". El admin sale del seed.
 */
import { z } from "zod";

export const ROLES = ["admin", "user"];

const campos = {
  nombre: z
    .string({ error: "El nombre es obligatorio" })
    .trim()
    .min(1, "El nombre no puede estar vacío")
    .max(80, "El nombre no puede superar 80 caracteres"),
  email: z
    .string({ error: "El email es obligatorio" })
    .trim()
    .toLowerCase()
    .email("Email inválido"),
  password: z
    .string({ error: "La contraseña es obligatoria" })
    .min(3, "La contraseña debe tener al menos 3 caracteres"),
};

// POST /api/usuarios — registro
export const crearUsuarioSchema = z.object({
  nombre: campos.nombre,
  email: campos.email,
  password: campos.password,
});

// PUT /api/usuarios/:id — todo opcional, pero al menos un campo
export const actualizarUsuarioSchema = z
  .object({
    nombre: campos.nombre.optional(),
    email: campos.email.optional(),
    password: campos.password.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Mandá al menos un campo para actualizar",
  });

// /:id — llega como string, coerce lo pasa a número
export const usuarioIdParamSchema = z.object({
  id: z.coerce
    .number({ error: "El id debe ser un número" })
    .int("El id debe ser entero")
    .positive("El id debe ser positivo"),
});

// GET /api/usuarios?rol=user&page=1&limit=20
export const listarUsuariosQuerySchema = z.object({
  rol: z
    .enum(ROLES, { error: `rol debe ser uno de: ${ROLES.join(", ")}` })
    .optional(),
  page: z.coerce
    .number({ error: "page debe ser un número" })
    .int()
    .positive("page debe ser mayor a 0")
    .default(1),
  limit: z.coerce
    .number({ error: "limit debe ser un número" })
    .int()
    .positive("limit debe ser mayor a 0")
    .max(100, "limit no puede superar 100")
    .default(20),
});