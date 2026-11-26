# API REST del Lavadero

Backend del sistema de turnos de un lavadero de autos, motos y camionetas. Es una API REST en **Node.js + Express 5** con autenticación **JWT**, validación con **Zod**, persistencia intercambiable (memoria o **SQLite** vía Sequelize), reglas de negocio configurables, integración con una API externa de feriados, documentación **OpenAPI/Swagger** y tests con **Vitest**.

Es el trabajo integrador de **Taller de Programación 2** ORT

---

## Tabla de contenidos

- [API REST del Lavadero](#api-rest-del-lavadero)
  - [Tabla de contenidos](#tabla-de-contenidos)
  - [Características](#características)
  - [Stack tecnológico](#stack-tecnológico)
  - [Arquitectura](#arquitectura)
  - [Estructura del proyecto](#estructura-del-proyecto)
  - [Instalación y puesta en marcha](#instalación-y-puesta-en-marcha)
    - [Requisitos](#requisitos)
    - [Pasos](#pasos)
    - [Scripts de npm](#scripts-de-npm)
    - [Usuarios iniciales](#usuarios-iniciales)
  - [Variables de entorno](#variables-de-entorno)
  - [Endpoints](#endpoints)
    - [Sistema](#sistema)
    - [Autenticación — `/api/auth`](#autenticación--apiauth)
    - [Turnos — `/api/turnos`](#turnos--apiturnos)
    - [Usuarios — `/api/usuarios` *(solo admin)*](#usuarios--apiusuarios-solo-admin)
    - [Feriados — `/api/feriados`](#feriados--apiferiados)
  - [Reglas de negocio](#reglas-de-negocio)
  - [Formato de errores](#formato-de-errores)
  - [Documentación interactiva (Swagger)](#documentación-interactiva-swagger)
  - [Tests](#tests)
  - [Probar la API](#probar-la-api)
  - [Scripts de demostración](#scripts-de-demostración)
  - [Decisiones de diseño](#decisiones-de-diseño)
  - [Autores](#autores)
  - [Autores](#autores-1)

---

## Características

- **CRUD de turnos y usuarios** con filtros, orden y paginación (`X-Total-Count` en el header).
- **Autenticación JWT** con roles `admin` y `user`, hash de contraseñas con bcrypt y freno de fuerza bruta en el login (rate limit).
- **Persistencia intercambiable**: en memoria o SQLite, con el mismo contrato (patrón DAO + factory).
- **Reglas de negocio configurables** por variables de entorno: tope de turnos pendientes, anticipación máxima en días hábiles, reprogramaciones y horario de atención.
- **Calendario de feriados** (API de ArgentinaDatos) con caché por año, timeout, concurrencia limitada y degradación elegante si el servicio externo falla.
- **Exportación a CSV** de los turnos, con protección contra inyección de fórmulas y enriquecimiento opcional con feriados.
- **Eventos de dominio** (`turno.creado`, `turno.finalizado`) con notificadores por consola o archivo.
- **Control de concurrencia**: índice único parcial y conteo transaccional en la base para evitar condiciones de carrera.
- **Documentación OpenAPI** generada a partir de los esquemas Zod.
- **Integración continua** con GitHub Actions.

## Stack tecnológico

| Área | Tecnología |
|---|---|
| Runtime | Node.js 24 (ES Modules) |
| Framework | Express 5 |
| Validación | Zod 4 |
| Persistencia | Sequelize 6 + SQLite (o memoria) |
| Seguridad | jsonwebtoken, bcryptjs, express-rate-limit |
| Documentación | swagger-ui-express, OpenAPI |
| Testing | Vitest, Supertest, V8 coverage |
| CI | GitHub Actions |

## Arquitectura

El proyecto sigue una arquitectura en capas con **inyección de dependencias** armada en un único *composition root* (`container/container.js`):

```
Request ─► Router ─► Middlewares ─► Controller ─► Caso de uso ─► DAO ─► Base (memoria / SQLite)
           (rutas)   (auth, Zod)    (HTTP ⇄ app)  (reglas)      │
                                                                 ├─► Gateway de feriados (API externa)
                                                                 ├─► Reloj inyectable
                                                                 └─► Event bus ─► Listeners ─► Notifier
```

- **Rutas**: definen verbo + path y encadenan autenticación, permisos y validación.
- **Controllers**: traducen HTTP a llamadas a casos de uso; no conocen DAOs.
- **Casos de uso**: contienen las reglas de negocio. No leen `process.env`, `new Date()` ni hacen `fetch` directo: todo llega **inyectado**, por lo que son deterministas y testeables.
- **DAOs**: misma interfaz para memoria y Sequelize, elegidos por `PERSISTENCE_TYPE`.
- **Errores**: se lanzan como `AppError` y los responde un único `errorHandler`.

## Estructura del proyecto

```
tp_integrador_lavedero/
├── index.js                 # Punto de entrada: app Express y middlewares globales
├── config/                  # Lectura y valores por defecto de variables de entorno
├── container/               # Composition root (arma todas las dependencias)
├── routes/                  # Rutas: auth, turnos, usuarios, feriados, docs
├── controllers/             # Traducción HTTP ⇄ casos de uso
├── usecases/                # Reglas de negocio (auth, turnos, usuarios, feriados)
├── domain/                  # Lógica pura: días hábiles, situación del turno
├── schemas/                 # Esquemas Zod (body, params, query)
├── dao/                     # DAOs: memory/ y sequelize/ + modelos y seed
├── connection/              # Conexión Sequelize/SQLite
├── gateways/                # Cliente de feriados, calendario falso y caché
├── events/                  # Event bus, nombres de eventos y listeners
├── notifiers/               # Notificadores (consola / archivo)
├── security/                # Hasher de contraseñas y servicio de tokens
├── middlewares/             # auth, validate, logger, notFound, errorHandler
├── errors/                  # AppError
├── utils/                   # Reloj, CSV, horario, concurrencia limitada
├── docs/                    # Generación del OpenAPI y catálogo de errores
├── scripts/                 # Demos de los conceptos vistos en clase
├── tests/                   # Tests (Vitest)
├── requests-*.http          # Colecciones de requests para probar a mano
└── .github/workflows/       # CI
```

## Instalación y puesta en marcha

### Requisitos

- **Node.js 24** (el que usa el CI; se necesita Node ≥ 20.6 por el flag `--env-file`).
- npm.

### Pasos

```bash
# 1. Instalar dependencias
npm install

# 2. Crear el archivo de entorno
cp .env.example .env          # en Windows: copy .env.example .env

# 3. Generar un secreto para JWT y pegarlo en JWT_SECRET (.env)
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"

# 4. Definir ADMIN_PASSWORD en el .env (sin ella no se crea el administrador)

# 5. Levantar el servidor
npm run dev                   # con recarga automática
# o
npm start
```

El servidor queda en `http://localhost:3000`. Verificación rápida:

```bash
curl http://localhost:3000/health
# {"status":"ok","persistence":"memory"}
```

> La app **no arranca** si falta `JWT_SECRET`: es intencional, para que nunca se despliegue con un secreto por defecto.

### Scripts de npm

| Script | Descripción |
|---|---|
| `npm start` | Inicia el servidor con las variables de `.env` |
| `npm run dev` | Igual que `start`, con `--watch` |
| `npm test` | Corre toda la suite una vez |
| `npm run test:watch` | Tests en modo observador |
| `npm run coverage` | Tests con reporte de cobertura (texto + HTML en `coverage/`) |

### Usuarios iniciales

Al arrancar se siembran datos de ejemplo:

| Usuario | Email | Contraseña | Rol |
|---|---|---|---|
| Juan Perez | `cliente@test.com` | `cliente1234` | user |
| María Gómez | `maria@test.com` | `maria1234` | user |
| Admin Lavadero | `ADMIN_EMAIL` (por defecto `admin@lavadero.com`) | `ADMIN_PASSWORD` | admin |

> Son credenciales de ejemplo solo para desarrollo. El administrador sale del `.env` para que su contraseña no quede en git.

## Variables de entorno

Copiá `.env.example` a `.env` y ajustá lo que necesites.

| Variable | Por defecto | Descripción |
|---|---|---|
| `PORT` | `3000` | Puerto del servidor |
| `DOCS_ENABLED` | `true` (fuera de producción) | Habilita `/docs` y `/openapi.json` |
| `PERSISTENCE_TYPE` | `memory` | `memory` o `sequelize` (SQLite) |
| `SQLITE_STORAGE` | `./data/lavadero.sqlite` | Ruta del archivo SQLite |
| `JWT_SECRET` | — **(obligatoria)** | Secreto para firmar tokens |
| `JWT_EXPIRES_IN` | `1h` | Vida del token (`15m`, `1h`, `7d`…) |
| `BCRYPT_ROUNDS` | `10` | Costo del hash de contraseñas |
| `LOGIN_RATE_LIMIT_MAX` | `5` | Intentos de login fallidos por IP y por minuto |
| `ADMIN_EMAIL` | `admin@lavadero.com` | Email del administrador inicial |
| `ADMIN_PASSWORD` | — | Contraseña del admin inicial (sin ella no se crea) |
| `CALENDARIO_TYPE` | `argentinadatos` | `argentinadatos`, `fake` (sin red) o `fake-down` (simula API caída) |
| `FERIADOS_API_URL` | `https://api.argentinadatos.com` | URL base de la API de feriados |
| `EXTERNAL_TIMEOUT_MS` | `5000` | Espera máxima por pedido externo |
| `EXTERNAL_CONCURRENCY` | `3` | Pedidos externos simultáneos (modo `limited`) |
| `FAKE_LATENCY_MS` | `300` | Demora simulada del calendario falso |
| `TURNOS_MAX_PENDIENTES` | `3` | R1: turnos pendientes por cliente |
| `TURNOS_DIAS_HABILES_ANTICIPACION` | `30` | R2: días hábiles máximos de anticipación |
| `TURNOS_MAX_REPROGRAMACIONES` | `1` | R4: reprogramaciones por turno |
| `CLOCK_NOW` | (hora real) | Reloj fijo para “viajar en el tiempo” (ej. `2026-12-01T12:00:00Z`) |
| `NOTIFIER_TYPE` | `console` | `console` o `file` |
| `NOTIFIER_FILE_PATH` | `./logs/eventos.log` | Archivo del notificador `file` |

## Endpoints

Todas las rutas de la API cuelgan de `/api`. Salvo `register` y `login`, exigen el header `Authorization: Bearer <token>`.

### Sistema

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | Estado del servicio y tipo de persistencia |
| GET | `/docs` | Swagger UI *(si `DOCS_ENABLED`)* |
| GET | `/openapi.json` | Especificación OpenAPI *(si `DOCS_ENABLED`)* |

### Autenticación — `/api/auth`

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/register` | Público | Autoregistro (siempre con rol `user`) |
| POST | `/login` | Público | Devuelve `{ token, usuario }`. Limitado por rate limit |
| GET | `/me` | Autenticado | Perfil del dueño del token |
| PUT | `/password` | Autenticado | Cambia la contraseña (`204`) |

### Turnos — `/api/turnos`

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/` | Autenticado | Lista turnos (un cliente ve solo los suyos) |
| GET | `/export.csv` | Admin | Exporta el listado en CSV |
| GET | `/:id` | Autenticado | Obtiene un turno |
| GET | `/:id/detalle` | Autenticado | Turno + si ese día es feriado |
| POST | `/` | Autenticado | Crea un turno (`201` + header `Location`) |
| PUT | `/:id/reprogramar` | Dueño o admin | Cambia la fecha del turno |
| PUT | `/:id` | Admin | Actualiza un turno |
| DELETE | `/:id` | Admin | Elimina un turno (`204`) |

**Filtros del listado** (`GET /api/turnos`): `estado`, `tipoVehiculo`, `clienteId`, `fecha`, `patente`, `desde`, `hasta` (inclusive), `ausentes=true`, `sort` (`id`, `fecha`, `patente`, `estado`, `tipoVehiculo`; prefijo `-` para descendente), `page` (por defecto 1) y `limit` (por defecto 20, máximo 100).

**Exportación** (`/export.csv`): acepta los mismos filtros, más `enriquecer=true|false` (agrega la columna `feriado`) y `separador` (`,` o `;`, útil para Excel en español). El header `X-Enrichment` informa `ok`, `unavailable` o `skipped`.

**Ejemplo — crear un turno:**

```http
POST /api/turnos
Authorization: Bearer <token>
Content-Type: application/json

{
  "patente": "AB123CD",
  "fecha": "2026-12-10T09:30",
  "tipoVehiculo": "auto"
}
```

```json
{
  "id": 5,
  "clienteId": 1,
  "patente": "AB123CD",
  "fecha": "2026-12-10T09:30",
  "tipoVehiculo": "auto",
  "estado": "Esperando el servicio",
  "reprogramaciones": 0,
  "situacion": "pendiente",
  "diasAusente": 0,
  "feriadosDisponibles": true
}
```

**Valores válidos**

- `tipoVehiculo`: `moto`, `auto`, `camioneta`
- `estado`: `Esperando el servicio`, `En proceso de lavado`, `Lavado finalizado`
- `patente`: formato `ABC123` o `AB123CD` (se normaliza a mayúsculas)
- `fecha`: `YYYY-MM-DDTHH:mm`, hora local del lavadero

### Usuarios — `/api/usuarios` *(solo admin)*

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Lista usuarios (`rol`, `page`, `limit`) |
| GET | `/:id` | Obtiene un usuario |
| POST | `/` | Crea un usuario |
| PUT | `/:id` | Actualiza un usuario |
| DELETE | `/:id` | Elimina un usuario y sus turnos (no se puede eliminar a un admin) |

### Feriados — `/api/feriados`

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/verificar?fechas=…&mode=…` | Autenticado | Consulta hasta 10 fechas (`YYYY-MM-DD` separadas por coma). `mode`: `sequential`, `parallel`, `limited` o `batch` (por defecto) |

## Reglas de negocio

El estado inicial de un turno lo fija siempre el servidor. Los números de las reglas son **configuración**, no código.

| Regla | Descripción | Error |
|---|---|---|
| **R1** | Un cliente puede tener como máximo `TURNOS_MAX_PENDIENTES` turnos pendientes (3). El conteo se repite dentro de la transacción del alta para evitar carreras | `409 LIMITE_TURNOS_PENDIENTES` |
| **R2** | Solo se reserva dentro de los próximos `TURNOS_DIAS_HABILES_ANTICIPACION` días hábiles (30), sin sábados, domingos ni feriados | `422 FECHA_FUERA_DE_RANGO` |
| **R3** | Un cliente con un turno **ausente** no puede sacar otro | `409 CLIENTE_CON_AUSENCIAS` |
| **R4** | Un turno se puede reprogramar como máximo `TURNOS_MAX_REPROGRAMACIONES` veces (1) | `409 LIMITE_REPROGRAMACIONES` |
| **R5** | Horario de atención de 08:00 a 16:45, en turnos cada 15 minutos | `400 VALIDACION` |
| **R6** | No se puede reprogramar si el dueño tiene **otro** turno ausente | `409 CLIENTE_CON_AUSENCIAS` |
| — | Un cliente no puede tener dos turnos pendientes para la misma patente | `409 PATENTE_CON_TURNO_PENDIENTE` |
| — | No se dan turnos para un momento que ya pasó | `422 FECHA_PASADA` |
| — | El lavadero cierra en feriados | `422 FECHA_FERIADO` |
| — | Un cliente solo saca y reprograma turnos a su nombre; el admin puede hacerlo por cualquiera | `403 PROHIBIDO` |

**Situación de un turno.** “Ausente” **no se guarda**: se calcula. Un turno está ausente si sigue en “Esperando el servicio” y su día ya pasó (el mismo día todavía no cuenta como ausente). Cada turno devuelve `situacion` (`pendiente`, `ausente`, `en proceso`, `finalizado`) y `diasAusente`. Así la información nunca queda desactualizada y, con `CLOCK_NOW`, se puede probar cualquier fecha.

**Degradación elegante.** Si la API de feriados no responde, los turnos igual se crean: el límite se calcula solo con fines de semana, no se controlan feriados y la respuesta informa `feriadosDisponibles: false`.

## Formato de errores

Todos los errores tienen la misma forma:

```json
{
  "error": {
    "code": "LIMITE_TURNOS_PENDIENTES",
    "message": "Un cliente puede tener hasta 3 turnos pendientes"
  }
}
```

Los errores de validación (`400 VALIDACION`) agregan `details`, con el campo y el motivo de cada problema:

```json
{
  "error": {
    "code": "VALIDACION",
    "message": "Datos inválidos en body",
    "details": [
      { "campo": "patente", "mensaje": "Patente inválida (formato ABC123 o AB123CD)" }
    ]
  }
}
```

Códigos principales:

| HTTP | Códigos |
|---|---|
| 400 | `VALIDACION`, `JSON_INVALIDO` |
| 401 | `TOKEN_FALTANTE`, `TOKEN_INVALIDO`, `TOKEN_VENCIDO`, `CREDENCIALES_INVALIDAS` |
| 403 | `PROHIBIDO` |
| 404 | `TURNO_NO_ENCONTRADO`, `USUARIO_NO_ENCONTRADO`, `RUTA_NO_ENCONTRADA` |
| 409 | `EMAIL_DUPLICADO`, `ADMIN_NO_ELIMINABLE`, `PATENTE_CON_TURNO_PENDIENTE`, `CLIENTE_CON_AUSENCIAS`, `LIMITE_TURNOS_PENDIENTES`, `TURNO_YA_ATENDIDO`, `TURNO_AUSENTE`, `LIMITE_REPROGRAMACIONES`, `TURNO_CAMBIO` |
| 422 | `FECHA_PASADA`, `FECHA_FUERA_DE_RANGO`, `FECHA_FERIADO` |
| 429 | `DEMASIADOS_INTENTOS` |
| 500 / 502 / 504 | `ERROR_INTERNO`, `EXTERNAL_API_ERROR`, `EXTERNAL_TIMEOUT` |

**¿409 o 422?** `409 Conflict` cuando el pedido choca con el *estado* actual (los otros turnos del cliente): el mismo pedido podría andar mañana. `422` cuando el dato está bien formado pero la regla lo rechaza por sí mismo: hay que mandar otra fecha.

## Documentación interactiva (Swagger)

Con el servidor corriendo, abrí **http://localhost:3000/docs**. La especificación se genera desde los mismos esquemas Zod que validan los pedidos, así que documentación y comportamiento no se desincronizan. El JSON crudo está en `/openapi.json`.

En producción la documentación queda deshabilitada por defecto; se puede forzar con `DOCS_ENABLED=true`.

## Tests

```bash
npm test            # una pasada
npm run test:watch  # modo observador
npm run coverage    # cobertura (reporte HTML en coverage/index.html)
```

- Los tests viven en `tests/` y **no necesitan** servidor levantado ni archivo `.env`.
- Cubren dominio, casos de uso, utilidades, gateways, el contrato de los DAOs (memoria y Sequelize cumplen la misma interfaz) y la validez de la especificación OpenAPI.
- La cobertura se mide sobre `domain/`, `usecases/`, `utils/` y `gateways/`.
- **CI**: GitHub Actions corre `npm ci` + `npm test` en cada push y pull request.

## Probar la API

El repo incluye colecciones de requests para la extensión **REST Client** de VS Code:

| Archivo | Contenido |
|---|---|
| `requests-jwt.http` | Registro, login, permisos por rol y CRUD con token |
| `requests-reglas.http` | Escenarios de las reglas R1–R6 |
| `requests-feriados.http` | Detalle de turno, modos de consulta de feriados y export CSV |

Para probar sin red o con el calendario caído usá `CALENDARIO_TYPE=fake` o `fake-down`. Para ver un turno ausente, fijá el reloj con `CLOCK_NOW`.

## Scripts de demostración

En `scripts/` hay demos independientes de los conceptos del curso. Se corren con `node scripts/<archivo>.js` (los que usan la base requieren `node --env-file=.env` y el servidor **detenido**, porque comparten el archivo SQLite).

| Script | Qué muestra |
|---|---|
| `hashDemo.js` | Hash con bcrypt: la misma contraseña genera hashes distintos |
| `zodDemo.js` | Esquemas Zod convertidos a JSON Schema (`input` vs `output`) |
| `csvDemo.js` | Escape de CSV y neutralización de inyección de fórmulas |
| `concurrencyDemo.js` | `mapWithConcurrency` nunca supera el límite |
| `diasHabilesDemo.js` | Días hábiles, ausencias y horario, con funciones puras |
| `integridadDemo.js` | Índice único parcial frente a altas simultáneas |
| `limitePendientesDemo.js` | R1 sin condición de carrera |

## Decisiones de diseño

- **Inyección de dependencias y composition root**: los casos de uso reciben DAO, reloj, calendario y reglas por parámetro, lo que los hace testeables sin red, base ni hora real.
- **Reloj inyectable**: `clock.hoy()` / `clock.ahora()` en hora del lavadero; permite fijar la fecha con `CLOCK_NOW`.
- **Factories** (DAO, calendario, notificador): se cambia de implementación por configuración, sin tocar el resto del código. Sequelize se importa dinámicamente, así en modo memoria nunca se carga.
- **Fail fast**: las reglas se evalúan de la más barata a la más cara; el calendario externo se consulta al final.
- **Defensa en profundidad contra concurrencia**: el caso de uso valida con buen mensaje, y la base es la última línea de defensa (índice único parcial para la patente y conteo transaccional para el tope). `reprogramar` usa un `UPDATE` condicional.
- **Seguridad**: el login responde igual si el email no existe o la contraseña es incorrecta y ejecuta bcrypt contra un hash falso para igualar tiempos; el rol nunca viene del cliente; los CSV neutralizan fórmulas.
- **Limitación conocida**: un JWT firmado sigue siendo válido hasta que vence, aunque el usuario se elimine o cambie de rol. Alternativas: tokens de vida corta, refresh tokens o lista de revocación.
- **Eventos desacoplados**: los casos de uso emiten eventos y los listeners notifican; un fallo de notificación no afecta la operación original.

## Autores

Trabajo integrador grupal de **Taller de Programación 2**, Instituto Tecnológico ORT.

| Integrante | Bloque inicial a cargo |
|---|---|
| Ricardo Muller |
| Nicolas Lezcano | 
| Luciano Ventura | 

El trabajo se organizó con Git en tres niveles de ramas: `main` (versión depurada), `develop` (integración) y `feature/*` (una por funcionalidad, creada desde `develop`). Las ampliaciones posteriores (feriados, reglas de negocio, documentación y tests) se incorporaron sobre esa base.

## Autores

Trabajo integrador de Taller de Programación 2, Instituto Tecnológico ORT.

- Ricardo Muller
- Luciano Ventura
- Nicolas Lezcano

