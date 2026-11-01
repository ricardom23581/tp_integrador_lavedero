/**
 * Datos iniciales para la persistencia en memoria.
 * Los ids los asigna el DAO en orden: el admin es el 1, así que los clientes
 * son el 2 y el 3 (los mismos clienteId que usan los turnos).
 */
export const usuariosSeed = [
  { nombre: "Admin Lavadero", email: "admin@test.com", password: "123", rol: "admin" },
  { nombre: "Juan Perez", email: "cliente@test.com", password: "123", rol: "user" },
  { nombre: "María Gómez", email: "maria@test.com", password: "123", rol: "user" },
];

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