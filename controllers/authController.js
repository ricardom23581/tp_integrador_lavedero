/**
 * Controller de autenticación: traduce HTTP a llamadas a casos de uso.
 * No conoce ningún DAO ni librería de seguridad. Los datos ya llegan validados por Zod.
 */
import AppError from "../errors/AppError.js";

export function makeAuthController(useCases) {
  // POST /api/auth/register → 201 con el usuario creado (sin hash)
  const register = async (req, res) => {
    const nuevo = await useCases.register(req.body);
    res.status(201).json(nuevo);
  };

  // POST /api/auth/login → 200 con { token, usuario }
  const login = async (req, res) => {
    const resultado = await useCases.login(req.body);
    res.status(200).json(resultado);
  };

  // GET /api/auth/me → el usuario dueño del token (req.user lo dejó authenticate)
  const me = async (req, res) => {
    const usuario = await useCases.getPerfil(req.user.id);
    if (!usuario) {
      throw new AppError("USUARIO_NO_ENCONTRADO", "El usuario del token ya no existe", 404);
    }
    res.status(200).json(usuario);
  };
  
  // PUT /api/auth/password → 204 sin body
  const cambiarPassword = async (req, res) => {
    await useCases.cambiarPassword(req.user.id, req.body);
    res.status(204).end();
  };
  
  return { register, login, me, cambiarPassword };
}