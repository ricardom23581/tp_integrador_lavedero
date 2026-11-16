/**
 * Rutas de usuarios: verbo + path → autenticación/permisos → validaciones → controller.
 *
 * Acceso: todo el recurso es solo para admin. El autoregistro público vive en /api/auth/register.
 */
import { Router } from "express";
import validate from "../middlewares/validate.js";
import {
  crearUsuarioSchema,
  actualizarUsuarioSchema,
  usuarioIdParamSchema,
  listarUsuariosQuerySchema,
} from "../schemas/usuarioSchema.js";

export function crearUsuariosRouter(controller, { authenticate, authorize }) {
  const router = Router();

  // Todo el recurso exige token válido y rol admin
  router.use(authenticate, authorize("admin"));

  router.get("/", validate(listarUsuariosQuerySchema, "query"), controller.listar);
  router.get("/:id", validate(usuarioIdParamSchema, "params"), controller.obtener);
  router.post("/", validate(crearUsuarioSchema), controller.crear);
  router.put(
    "/:id",
    validate(usuarioIdParamSchema, "params"),
    validate(actualizarUsuarioSchema),
    controller.actualizar
  );
  router.delete("/:id", validate(usuarioIdParamSchema, "params"), controller.eliminar);

  return router;
}