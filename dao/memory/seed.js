/**
 * Datos iniciales de ejemplo (memoria y Sequelize).
 * Solo clientes: el administrador NO está acá, lo crea seedAdmin desde el contenedor
 * con ADMIN_EMAIL y ADMIN_PASSWORD del .env (así su contraseña no queda escrita en git).
 * Los ids los asigna el DAO en orden: Juan es el 1 y María la 2 (los clienteId de los turnos).
 * Las contraseñas cumplen la misma regla que el registro (8 a 72 caracteres).
 */
export const usuariosSeed = [
  { nombre: "Juan Perez", email: "cliente@test.com", password: "cliente1234", rol: "user" },
  { nombre: "María Gómez", email: "maria@test.com", password: "maria1234", rol: "user" },
];

/**
 * Devuelve el seed de usuarios listo para guardar: reemplaza "password" (dato de ejemplo)
 * por "passwordHash". Se hashea al arrancar, así ningún DAO ni base guarda texto plano.
 */
export async function usuariosSeedConHash(hasher) {
  return Promise.all(
    usuariosSeed.map(async ({ password, ...usuario }) => ({
      ...usuario,
      passwordHash: await hasher.hash(password),
    }))
  );
}

export const turnosSeed = [
  {
    clienteId: 2,
    patente: "ABC123",
    fecha: "2026-11-03T09:00",
    tipoVehiculo: "auto",
    estado: "Esperando el servicio",
  },
  {
    clienteId: 2,
    patente: "AB123CD",
    fecha: "2026-11-03T10:30",
    tipoVehiculo: "camioneta",
    estado: "En proceso de lavado",
  },
  {
    clienteId: 3,
    patente: "AA987ZZ",
    fecha: "2026-11-04T08:15",
    tipoVehiculo: "moto",
    estado: "Lavado finalizado",
  },
  {
    clienteId: 3,
    patente: "XYZ789",
    fecha: "2026-11-02T16:45",
    tipoVehiculo: "auto",
    estado: "Esperando el servicio",
  },
];