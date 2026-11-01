/**
 * Controller de usuarios: traduce HTTP a llamadas a casos de uso.
 * No conoce ningún DAO. Los datos ya llegan validados por Zod.
 */
import AppError from "../errors/AppError.js";

const usuarioNoEncontrado = (id) =>
  new AppError("USUARIO_NO_ENCONTRADO", `No existe un usuario con id ${id}`, 404);

export function makeUsuariosController(useCases) {
  const listar = async (req, res) => {
    const { items, total } = await useCases.getUsuarios(req.validated.query);
    res.set("X-Total-Count", String(total));
    res.status(200).json(items);
  };

  const obtener = async (req, res) => {
    const { id } = req.validated.params;
    const usuario = await useCases.getUsuarioById(id);
    if (!usuario) throw usuarioNoEncontrado(id);
    res.status(200).json(usuario);
  };

  const crear = async (req, res) => {
    const nuevo = await useCases.createUsuario(req.body);
    res.status(201).json(nuevo);
  };

  const actualizar = async (req, res) => {
    const { id } = req.validated.params;
    const actualizado = await useCases.updateUsuario(id, req.body);
    if (!actualizado) throw usuarioNoEncontrado(id);
    res.status(200).json(actualizado);
  };

  const eliminar = async (req, res) => {
    const { id } = req.validated.params;
    const borrado = await useCases.deleteUsuario(id);
    if (!borrado) throw usuarioNoEncontrado(id);
    res.status(204).end();
  };

  return { listar, obtener, crear, actualizar, eliminar };
}