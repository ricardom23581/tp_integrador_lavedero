import { describe, it, expect, vi, beforeEach } from "vitest";
import loginUsuario from "../../../usecases/auth/loginUsuario.js";
import UsuariosMemoryDao from "../../../dao/memory/UsuariosMemoryDao.js";

/**
 * loginUsuario con STUBS de bcrypt y JWT: mismo contrato (hash/compare y sign), sin el costo ni el secreto.
 * El "hash" del stub es simplemente "hash:" + la contraseña: alcanza para que compare() sea verdadero o falso.
 */
describe("loginUsuario", () => {
  let dao;
  let hasher;
  let tokens;
  const hashFalso = Promise.resolve("hash:falso"); // en la app lo calcula makeAuthUseCases una sola vez

  beforeEach(() => {
    dao = new UsuariosMemoryDao([
      { id: 7, nombre: "Juan", email: "juan@test.com", rol: "user", passwordHash: "hash:secreta123" },
    ]);
    hasher = { hash: vi.fn(async (p) => "hash:" + p), compare: vi.fn(async (p, h) => h === "hash:" + p) };
    tokens = { sign: vi.fn(() => "token-de-prueba") };
  });

  const login = (email, password) => loginUsuario({ email, password }, dao, hasher, tokens, hashFalso);

  it("con credenciales correctas devuelve { token, usuario }, y usuario NO trae passwordHash", async () => {
    const resultado = await login("juan@test.com", "secreta123");

    expect(resultado).toEqual({
      token: "token-de-prueba",
      usuario: { id: 7, nombre: "Juan", email: "juan@test.com", rol: "user" },
    });
    expect(resultado.usuario).not.toHaveProperty("passwordHash");
  });

  it("firma el token con { sub: '7', rol: 'user' } y nada más", async () => {
    await login("juan@test.com", "secreta123");

    expect(tokens.sign).toHaveBeenCalledWith({ sub: "7", rol: "user" });
  });

  it("contraseña incorrecta → 401 CREDENCIALES_INVALIDAS, y no se firma ningún token", async () => {
    await expect(login("juan@test.com", "otra")).rejects.toMatchObject({ code: "CREDENCIALES_INVALIDAS", statusCode: 401 });
    expect(tokens.sign).not.toHaveBeenCalled();
  });

  it("email inexistente → EXACTAMENTE el mismo error que una contraseña incorrecta", async () => {
    const errorPassword = await login("juan@test.com", "otra").catch((e) => e);
    const errorEmail = await login("nadie@test.com", "secreta123").catch((e) => e);

    expect({ code: errorEmail.code, message: errorEmail.message, statusCode: errorEmail.statusCode }).toEqual({
      code: errorPassword.code,
      message: errorPassword.message,
      statusCode: errorPassword.statusCode,
    });
  });

  it("con un email inexistente, igual se compara contra el hash falso (protección contra ataques de tiempo)", async () => {
    await login("nadie@test.com", "secreta123").catch(() => {});

    expect(hasher.compare).toHaveBeenCalledOnce();
    expect(hasher.compare).toHaveBeenCalledWith("secreta123", "hash:falso");
  });
});