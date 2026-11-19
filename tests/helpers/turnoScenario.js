import TurnosMemoryDao from "../../dao/memory/TurnosMemoryDao.js";
import UsuariosMemoryDao from "../../dao/memory/UsuariosMemoryDao.js";
import { makeEventBus } from "../../events/eventBus.js";
import { createClock } from "../../utils/clock.js";
import createFakeCalendario from "../../gateways/fakeCalendario.js";
import makeTurnoUseCases from "../../usecases/turnos/makeTurnoUseCases.js";
import { ESTADO_PENDIENTE } from "../../domain/situacionTurno.js";

/**
 * Helper de escenarios para los tests de turnos (Clase 14).
 *
 * Cada test llama a buildTurnoScenario() y recibe un "mundo" NUEVO: DAOs en memoria recién creados,
 * un bus de eventos propio, un reloj FIJO y el calendario falso SIN demora. Nada se comparte entre tests.
 *
 * Ejercicio 4.6 — ¿Por qué no usamos los DAOs que arma daoFactory para la app? Porque son únicos para todo el
 *   proceso: si un test crea un turno, el siguiente lo encontraría, y el resultado dependería del ORDEN en que
 *   corren los tests. Además traen el seed (Juan, María y sus turnos). Acá instanciamos la clase en cada escenario.
 * Ejercicio 4.6 — ¿Por qué COPIAMOS cada usuario antes de pasárselo al DAO? En la biblioteca era obligatorio:
 *   BooksMemoryDao guardaba el MISMO objeto y adjustStock le cambiaba el stock, así que un test arruinaba los
 *   datos del siguiente. Los DAOs del lavadero ya copian al guardar ({ id, ...u } en el constructor), así que
 *   acá la copia es DEFENSIVA: si mañana alguien cambia el DAO para que guarde la referencia, los tests no se
 *   empiezan a pisar entre sí de forma misteriosa.
 */

/*
 * ===================== RESPUESTAS DE LA CLASE 14 =====================
 *
 * 5.8 Sacarle el `await` a un `expect(...).rejects`: en Vitest 5 el test SÍ se pone en rojo, con el mensaje
 *   "Promise returned by `expect(actual).rejects...` was not awaited". En versiones viejas quedaba en VERDE: el
 *   test terminaba antes de que la promesa se resolviera, y la aserción fallida aparecía (si aparecía) como un
 *   "unhandled rejection" suelto. Era un falso positivo: por eso siempre `await expect(...).rejects`.
 *
 * 8.3 ¿Cuánto tardaría la suite con bcrypt real (10 rondas) en loginUsuario? Cada hash/compare tarda ~50-100 ms:
 *   unos segundos solo para ese archivo, en vez de milisegundos. Y con ArgentinaDatos real en vez del calendario
 *   falso, cada createTurno haría un pedido por internet: la suite dependería de la red, tardaría cientos de ms
 *   por test, y si la API está caída los tests fallarían sin que nuestro código tenga un bug.
 *   Los stubs y el fake con latencyMs: 0 hacen la suite rápida y determinista.
 *
 *  *
 * 9.1 Cobertura (npm run coverage, con los tests de los ej. 1 a 8):
 *   | Carpeta          | % Lines | % Branch | Un archivo o línea sin cubrir importante                            |
 *   | domain           | 100     | 94.4     | situacionTurno.js línea 27: un estado desconocido (`?? turno.estado`) |
 *   | usecases/turnos  | 54.8    | 47.9     | getTurnos.js (0%): el 403 cuando un cliente pide turnos de otro       |
 *   | gateways         | 84.3    | 70.0     | calendarioFactory.js (0%): qué calendario arma según CALENDARIO_TYPE  |
 *   (utils no aparece en la consola porque está al 100%: el reporte "text" no lista lo que está completo.)
 * 9.2 Mutaciones (tests que fallan): createTurno >= por > en R1: 0 (!) | estaAusente < por <=: 3 |
 *   horario hora < HORA_CIERRE por <=: 1 | validarCalendario sin `if (!(err instanceof AppError)) throw err;`: 2 |
 *   reprogramarTurno con la anticipación contada desde la fecha VIEJA del turno (no desde hoy): 2
 * 9.3 La de R1 SOBREVIVIÓ: el DAO vuelve a contar los pendientes dentro del alta (ej. 9.1 de la clase 13) y
 *   rechaza con el MISMO código, así que ningún test notaba la diferencia. Lo único que cambiaba es que el pedido
 *   llegaba más lejos y consultaba el calendario. Test agregado en createTurno.test.js: "R1 corta en el caso de
 *   uso (fail fast)..." con un spy sobre el calendario. Con ese test, la mutación hace fallar 1.
 * 9.4 100% de cobertura no garantiza que no haya bugs: la cobertura mide qué líneas se EJECUTARON, no qué se
 *   VERIFICÓ. Ejemplo: it("crea un turno", async () => { await useCases.createTurno(nuevoTurno(), JUAN); });
 *   recorre casi todo createTurno y no tiene ni un expect. Las mutaciones son las que muestran eso.
 * =====================================================================
 */

// Actores: lo que el middleware de auth deja en req.user (el caso de uso solo mira id y rol)
export const JUAN = { id: 1, rol: "user" };
export const MARIA = { id: 2, rol: "user" };
export const ADMIN = { id: 99, rol: "admin" };

const USUARIOS = [
  { id: 1, nombre: "Juan Perez", email: "juan@test.com", rol: "user", passwordHash: "x" },
  { id: 2, nombre: "María Gómez", email: "maria@test.com", rol: "user", passwordHash: "x" },
  { id: 99, nombre: "Admin", email: "admin@test.com", rol: "admin", passwordHash: "x" },
];

// "Hoy" por defecto: miércoles 4 de noviembre de 2026, al mediodía en Buenos Aires (ahora = "2026-11-04T12:00").
// Con 15 días hábiles de anticipación y el feriado del lunes 23 (calendario falso), el límite es el jueves 26.
export const DEFAULT_NOW = "2026-11-04T12:00:00-03:00";

// Un turno válido para el reloj por defecto: cada test pisa solo lo que le interesa
export const nuevoTurno = (cambios = {}) => ({ patente: "AB123CD", tipoVehiculo: "auto", fecha: "2026-11-10T10:00", ...cambios });

export function buildTurnoScenario({
  now = DEFAULT_NOW,
  usuarios = USUARIOS,
  reglas = {},
  calendario = createFakeCalendario({ latencyMs: 0 }),
} = {}) {
  const usuariosDao = new UsuariosMemoryDao(usuarios.map((u) => ({ ...u })));
  const turnosDao = new TurnosMemoryDao();
  const events = makeEventBus();
  const clock = createClock({ fixedNow: now });
  const reglasFinales = { maxPendientes: 3, diasHabilesAnticipacion: 15, maxReprogramaciones: 1, ...reglas };

  // La MISMA factory que usa el container: si mañana cambia cómo se arman los casos de uso, el test se entera
  const useCases = makeTurnoUseCases({ turnosDao, usuariosDao, events, calendario, clock, reglas: reglasFinales });

  /**
   * Arma el PASADO directamente en el DAO, sin pasar por las reglas.
   * Sirve para preparar situaciones que con la API llevarían días: un turno ausente, uno ya reprogramado, uno atendido.
   */
  async function givenTurno({ clienteId, patente = "AB123CD", fecha, estado = ESTADO_PENDIENTE, tipoVehiculo = "auto", reprogramaciones = 0 }) {
    const turno = await turnosDao.save({ clienteId, patente, fecha, estado, tipoVehiculo });
    return reprogramaciones ? turnosDao.update(turno.id, { reprogramaciones }) : turno;
  }

  // Atajo: los turnos pendientes de un cliente (para verificar que un rechazo no guardó nada)
  const pendientesDe = (clienteId) => turnosDao.getAll({ clienteId, estado: ESTADO_PENDIENTE });

  return { useCases, turnosDao, usuariosDao, events, clock, calendario, reglas: reglasFinales, givenTurno, pendientesDe };
}