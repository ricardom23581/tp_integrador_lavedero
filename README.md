# Lavadero API

API REST desarrollada con Node.js y Express para administrar usuarios y turnos de un lavadero de vehículos. Incluye autenticación JWT, autorización por roles, persistencia configurable, validación con Zod, consulta de feriados, reglas de negocio, exportación CSV y documentación OpenAPI/Swagger.

## Funcionalidades

- Registro e inicio de sesión con contraseñas cifradas mediante bcrypt.
- Autenticación mediante JSON Web Tokens (JWT).
- Roles `admin` y `user`.
- Administración completa de usuarios y turnos.
- Listado con filtros, ordenamiento y paginación.
- Reprogramación de turnos con reglas de negocio configurables.
- Consulta de feriados mediante API externa o calendario de prueba.
- Exportación de turnos a CSV.
- Documentación interactiva con Swagger UI.
- Persistencia en memoria o SQLite mediante Sequelize.
- Manejo centralizado y consistente de errores.
- Notificación de eventos por consola o archivo.

## Tecnologías

- Node.js
- Express 5
- Zod
- JWT
- bcryptjs
- Sequelize
- SQLite
- Swagger UI / OpenAPI 3.1
- Vitest y Supertest

## Requisitos

- Node.js 24 recomendado.
- npm.
- Conexión a Internet solo si se usa `CALENDARIO_TYPE=argentinadatos`.

## Instalación y ejecución

```powershell
cd "C:\Users\Usuario\Documents\TP2 - Trabajo Practico\tp_integrador_lavedero"
npm install
Copy-Item .env.example .env
```

Completar como mínimo `JWT_SECRET` y `ADMIN_PASSWORD` en `.env`. En PowerShell se puede generar un secreto seguro con:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Ejecutar en modo normal:

```powershell
npm start
```

Ejecutar con reinicio automático al modificar archivos:

```powershell
npm run dev
```

La aplicación queda disponible en:

- API: `http://localhost:3000/api`
- Health check: `http://localhost:3000/health`
- Swagger: `http://localhost:3000/docs`
- Especificación OpenAPI: `http://localhost:3000/openapi.json`

## Configuración

Las variables disponibles están documentadas en `.env.example`.

| Variable | Valor predeterminado | Uso |
|---|---:|---|
| `PORT` | `3000` | Puerto del servidor |
| `DOCS_ENABLED` | habilitado fuera de producción | Activa Swagger y `/openapi.json` |
| `PERSISTENCE_TYPE` | `memory` | `memory` o `sequelize` |
| `SQLITE_STORAGE` | `./data/lavadero.sqlite` | Archivo SQLite |
| `JWT_SECRET` | obligatorio | Secreto para firmar JWT |
| `JWT_EXPIRES_IN` | `1h` | Duración del token |
| `BCRYPT_ROUNDS` | `10` | Costo de cifrado de contraseñas |
| `LOGIN_RATE_LIMIT_MAX` | `5` | Intentos fallidos permitidos por IP y minuto |
| `ADMIN_EMAIL` | `admin@lavadero.com` | Email del administrador inicial |
| `ADMIN_PASSWORD` | obligatorio para crear el admin | Contraseña del administrador inicial |
| `CALENDARIO_TYPE` | `argentinadatos` | `argentinadatos`, `fake` o `fake-down` |
| `FERIADOS_API_URL` | `https://api.argentinadatos.com` | URL del calendario |
| `EXTERNAL_TIMEOUT_MS` | `5000` | Timeout de la API externa |
| `EXTERNAL_CONCURRENCY` | `3` | Máximo de consultas simultáneas |
| `FAKE_LATENCY_MS` | `300` | Latencia simulada del calendario falso |
| `TURNOS_MAX_PENDIENTES` | `3` | Máximo de turnos pendientes por cliente |
| `TURNOS_DIAS_HABILES_ANTICIPACION` | `30` | Anticipación máxima permitida |
| `TURNOS_MAX_REPROGRAMACIONES` | `1` | Reprogramaciones permitidas por turno |
| `CLOCK_NOW` | hora real | Fecha fija para pruebas de reglas temporales |
| `NOTIFIER_TYPE` | `console` | `console` o `file` |
| `NOTIFIER_FILE_PATH` | `./logs/eventos.log` | Archivo de eventos |

Ejemplo mínimo para desarrollo:

```env
PORT=3000
PERSISTENCE_TYPE=memory
CALENDARIO_TYPE=fake
JWT_SECRET=pegue_aqui_un_secreto_largo
JWT_EXPIRES_IN=1h
ADMIN_EMAIL=admin@lavadero.com
ADMIN_PASSWORD=AdminSegura123
NOTIFIER_TYPE=console
```

### Persistencia

- `PERSISTENCE_TYPE=memory`: reinicia los datos al reiniciar el servidor.
- `PERSISTENCE_TYPE=sequelize`: usa SQLite y conserva los datos en `SQLITE_STORAGE`.

En modo SQLite, para comenzar con una base limpia se debe detener el servidor y eliminar el archivo o la carpeta `data`.

## Datos iniciales

Al iniciar se crean dos usuarios de ejemplo en memoria y SQLite:

| Usuario | Email | Contraseña | Rol |
|---|---|---|---|
| Juan Pérez | `cliente@test.com` | `cliente1234` | `user` |
| María Gómez | `maria@test.com` | `maria1234` | `user` |
| Administrador | `ADMIN_EMAIL` | `ADMIN_PASSWORD` | `admin` |

El administrador solo se crea si `ADMIN_PASSWORD` tiene un valor configurado.

## Autenticación

1. Registrar un usuario o iniciar sesión.
2. Copiar el `token` devuelto por el login.
3. Enviar el token en las rutas protegidas:

```http
Authorization: Bearer <token>
```

En Swagger UI usar **Authorize** y pegar solamente el token, sin `Bearer`.

Los usuarios registrados mediante `/api/auth/register` siempre tienen el rol `user`. El administrador se crea desde las variables de entorno.

### Ejemplo de inicio de sesión

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@lavadero.com",
  "password": "AdminSegura123"
}
```

Respuesta:

```json
{
  "token": "<jwt>",
  "usuario": {
    "id": 3,
    "nombre": "Administrador",
    "email": "admin@lavadero.com",
    "rol": "admin"
  }
}
```

## Endpoints

### Health y documentación

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/health` | Público | Estado y tipo de persistencia |
| `GET` | `/docs` | Público | Swagger UI |
| `GET` | `/openapi.json` | Público | Especificación OpenAPI |

### Autenticación

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/api/auth/register` | Público | Crear una cuenta `user` |
| `POST` | `/api/auth/login` | Público | Iniciar sesión y obtener JWT |
| `GET` | `/api/auth/me` | Autenticado | Obtener el perfil propio |
| `PUT` | `/api/auth/password` | Autenticado | Cambiar la contraseña propia |

Ejemplo de registro:

```json
{
  "nombre": "Ana Pérez",
  "email": "ana@example.com",
  "password": "ClaveSegura123"
}
```

### Usuarios

Todas las rutas requieren rol `admin`.

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/usuarios` | Listar usuarios |
| `GET` | `/api/usuarios/:id` | Obtener un usuario |
| `POST` | `/api/usuarios` | Crear un usuario |
| `PUT` | `/api/usuarios/:id` | Actualizar nombre, email o contraseña |
| `DELETE` | `/api/usuarios/:id` | Eliminar un usuario |

Filtros de listado:

- `rol`: `admin` o `user`.
- `page`: página, comienza en `1`.
- `limit`: resultados por página, máximo `100`.

La contraseña debe tener entre 8 y 72 caracteres.

### Turnos

Todas las rutas requieren autenticación. Las operaciones administrativas requieren rol `admin`.

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/api/turnos` | Autenticado | Listar y filtrar turnos |
| `POST` | `/api/turnos` | Autenticado | Crear un turno |
| `GET` | `/api/turnos/export.csv` | `admin` | Exportar turnos a CSV |
| `GET` | `/api/turnos/:id` | Autenticado | Obtener un turno |
| `GET` | `/api/turnos/:id/detalle` | Autenticado | Obtener turno con estado del feriado |
| `PUT` | `/api/turnos/:id` | `admin` | Actualizar patente, fecha, tipo o estado |
| `PUT` | `/api/turnos/:id/reprogramar` | Dueño o `admin` | Reprogramar un turno |
| `DELETE` | `/api/turnos/:id` | `admin` | Eliminar un turno |

Los usuarios solo pueden listar y consultar sus propios turnos. Los administradores pueden trabajar sobre todos los turnos.

Ejemplo de creación:

```json
{
  "clienteId": 1,
  "patente": "ABC123",
  "fecha": "2026-12-10T09:30",
  "tipoVehiculo": "auto"
}
```

- Un usuario no necesita enviar `clienteId`: el servidor asigna el usuario autenticado.
- Un administrador puede indicar otro `clienteId`.
- `tipoVehiculo`: `moto`, `auto` o `camioneta`.
- `estado`: `Esperando el servicio`, `En proceso de lavado` o `Lavado finalizado`.
- La patente admite formato viejo `ABC123` o Mercosur `AB123CD`.
- Las fechas usan `YYYY-MM-DDTHH:mm`.

Filtros de `/api/turnos`:

- `estado`
- `tipoVehiculo`
- `clienteId`
- `fecha` con formato `YYYY-MM-DD`
- `patente`
- `desde` y `hasta`
- `ausentes=true`
- `sort`
- `page`
- `limit`

Los campos ordenables son `id`, `fecha`, `patente`, `estado` y `tipoVehiculo`. Anteponer `-` ordena de forma descendente, por ejemplo `sort=-fecha`.

El listado devuelve `X-Total-Count` con la cantidad total antes de paginar.

La ruta fija `/api/turnos/export.csv` debe declararse antes que `/:id` para no confundirse con un id llamado `export.csv`.

Ejemplos de exportación:

```text
GET /api/turnos/export.csv
GET /api/turnos/export.csv?estado=Esperando%20el%20servicio&sort=-fecha
GET /api/turnos/export.csv?enriquecer=true&separador=;
```

`enriquecer=true` agrega información de feriados. `separador` acepta `,` o `;`. La respuesta informa el estado en `X-Enrichment`: `ok`, `unavailable` o `skipped`.

### Feriados

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/api/feriados/verificar` | Autenticado | Consultar varias fechas |

Ejemplo:

```text
GET /api/feriados/verificar?fechas=2026-12-25,2026-12-26&mode=batch
```

- `fechas`: hasta 10 fechas `YYYY-MM-DD`, separadas por comas.
- `mode`: `sequential`, `parallel`, `limited` o `batch`.
- El valor predeterminado de `mode` es `batch`.

## Reglas de negocio

R5: los turnos solo pueden reservarse entre las 08:00 y las 16:45, en intervalos de 15 minutos.

R2: un turno no puede superar el máximo configurable de días hábiles de anticipación.

R1: un cliente no puede superar el máximo configurable de turnos pendientes.

R3: si un cliente tiene una ausencia (`situacion=ausente`) no puede sacar otro turno hasta resolver su turno pendiente vencido.

R4: un turno puede reprogramarse como máximo una vez por configuración.

R6: no se pueden crear turnos en feriados.

La situación de un turno se calcula desde su estado y su fecha:

- `pendiente`: esperando el servicio y todavía no pasó su fecha.
- `ausente`: esperando el servicio y su fecha ya pasó.
- `en proceso`: el lavado está en proceso.
- `finalizado`: el lavado fue finalizado.

La configuración permite ajustar `TURNOS_MAX_PENDIENTES`, `TURNOS_DIAS_HABILES_ANTICIPACION` y `TURNOS_MAX_REPROGRAMACIONES`.

## Formato de errores

Los errores se devuelven como JSON:

```json
{
  "error": {
    "code": "VALIDACION",
    "message": "Datos inválidos en body",
    "details": [
      {
        "campo": "email",
        "mensaje": "Email inválido"
      }
    ]
  }
}
```

### Códigos principales

| Código | HTTP | Descripción |
|---|---:|---|
| `VALIDACION` | 400 | Datos de body, parámetros o query inválidos |
| `JSON_INVALIDO` | 400 | JSON mal formado |
| `TOKEN_FALTANTE` | 401 | Falta el header Bearer |
| `TOKEN_INVALIDO` | 401 | JWT inválido |
| `TOKEN_VENCIDO` | 401 | JWT vencido |
| `CREDENCIALES_INVALIDAS` | 401 | Email o contraseña incorrectos |
| `PROHIBIDO` | 403 | Rol o propietario incorrecto |
| `TURNO_NO_ENCONTRADO` | 404 | Turno inexistente |
| `USUARIO_NO_ENCONTRADO` | 404 | Usuario inexistente |
| `RUTA_NO_ENCONTRADA` | 404 | Ruta inexistente |
| `EMAIL_DUPLICADO` | 409 | Email ya registrado |
| `ADMIN_NO_ELIMINABLE` | 409 | No se puede eliminar un administrador |
| `PATENTE_CON_TURNO_PENDIENTE` | 409 | Ya existe turno pendiente para la patente |
| `CLIENTE_CON_AUSENCIAS` | 409 | El cliente tiene una ausencia pendiente |
| `LIMITE_TURNOS_PENDIENTES` | 409 | Se alcanzó el límite de pendientes |
| `TURNO_YA_ATENDIDO` | 409 | No se puede reprogramar un turno atendido |
| `TURNO_AUSENTE` | 409 | No se puede reprogramar un turno ausente |
| `LIMITE_REPROGRAMACIONES` | 409 | Se alcanzó el límite de reprogramaciones |
| `TURNO_CAMBIO` | 409 | El turno cambió durante el procesamiento |
| `FECHA_PASADA` | 422 | La fecha ya pasó |
| `FECHA_FUERA_DE_RANGO` | 422 | Supera la anticipación permitida |
| `FECHA_FERIADO` | 422 | El lavadero permanece cerrado |
| `DEMASIADOS_INTENTOS` | 429 | Se excedieron los intentos de login |
| `EXTERNAL_API_ERROR` | 502 | Falló el calendario externo |
| `EXTERNAL_TIMEOUT` | 504 | El calendario externo tardó demasiado |
| `ERROR_INTERNO` | 500 | Error inesperado del servidor |

## Archivos de pruebas HTTP

El proyecto incluye archivos listos para VS Code REST Client:

- `requests-jwt.http`: autenticación, usuarios, turnos y validaciones.
- `requests-feriados.http`: feriados, modos de consulta y exportación CSV.
- `requests-reglas.http`: reglas de negocio, reprogramación y reloj configurable.

Recomendación:

1. Iniciar el servidor.
2. Abrir uno de los archivos `.http`.
3. Ejecutar las solicitudes en el orden indicado.

Para login, los archivos usan las variables `ADMIN_EMAIL` y `ADMIN_PASSWORD` del `.env`.

## Pruebas automáticas

Ejecutar todas las pruebas:

```powershell
npm test
```

Modo observador:

```powershell
npm run test:watch
```

Generar cobertura:

```powershell
npm run coverage
```

Las pruebas verifican casos de uso, DAOs, reglas de fechas, validaciones, feriados, persistencia y documentación OpenAPI.

## Arquitectura

El proyecto usa una separación por responsabilidades:

- `routes`: definición de rutas y permisos.
- `controllers`: traducción entre HTTP y casos de uso.
- `usecases`: reglas de aplicación.
- `domain`: reglas de negocio específicas.
- `schemas`: validación de entrada con Zod.
- `dao`: acceso a datos en memoria o Sequelize.
- `gateways`: integración con el calendario de feriados.
- `middlewares`: autenticación, validación, logging y errores.
- `events` y `notifiers`: publicación y procesamiento de eventos.
- `security`: cifrado de contraseñas y JWT.
- `docs`: generación de la especificación OpenAPI.
- `container`: composición e inyección de dependencias.

## Integración continua

GitHub Actions ejecuta `npm ci` y `npm test` en Node.js 24 ante pushes y pull requests.
