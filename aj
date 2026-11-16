[33mcommit f90be43e00519acfac295f616cf4bae4c43d862c[m[33m ([m[1;36mHEAD[m[33m -> [m[1;32mdevelop[m[33m, [m[1;31morigin/develop[m[33m)[m
Merge: e7fbc10 b40cd2f
Author: nicolezbur <nicolas.lezcano@gmail.com>
Date:   Sun Nov 1 14:18:37 2026 -0300

    Merge feature/sequelize hacia develop

[33mcommit b40cd2fe7f87dd588401c9366ba09591867cea56[m[33m ([m[1;31morigin/feature/sequelize[m[33m)[m
Author: nicolezbur <nicolas.lezcano@gmail.com>
Date:   Sun Nov 1 14:15:57 2026 -0300

    Agrega persistencia Sequelize intercambiable con memoria
    
    DAOs de Sequelize para turnos y usuarios, factory dinamica y container asincrono con init()

 container/container.js                | 13 [32m++++++[m[31m---[m
 dao/daoFactory.js                     | 26 [32m+++++++++++[m[31m-------[m
 dao/sequelize/TurnosSequelizeDao.js   | 52 [32m+++++++++++++++++++++++++++++++++++[m
 dao/sequelize/UsuariosSequelizeDao.js | 50 [32m+++++++++++++++++++++++++++++++++[m
 index.js                              |  2 [32m+[m[31m-[m
 usecases/turnos/updateTurno.js        | 10 [32m+++[m[31m----[m
 6 files changed, 133 insertions(+), 20 deletions(-)

[33mcommit c601727a21e490b86dada33d4660fdb5adeae5ef[m
Author: nicolezbur <nicolas.lezcano@gmail.com>
Date:   Sun Nov 1 13:43:05 2026 -0300

    Agrega conexion, modelos y asociaciones de Sequelize
    
    Modelos Usuario y Turno con relacion 1 a N, config de SQLITE_STORAGE y .env.example

 .env.example               |  4 [32m++[m[31m--[m
 .gitignore                 |  3 [32m++[m[31m-[m
 config/config.js           |  4 [32m++[m[31m--[m
 connection/sequelize.js    | 19 [32m+++++++++++++++++++[m
 dao/models/TurnoModel.js   | 34 [32m++++++++++++++++++++++++++++++++++[m
 dao/models/UsuarioModel.js | 34 [32m++++++++++++++++++++++++++++++++++[m
 dao/models/index.js        | 12 [32m++++++++++++[m
 7 files changed, 105 insertions(+), 5 deletions(-)

[33mcommit e7fbc10867824c1d7a1027e1dce03b9992062905[m
Merge: 5ecb5e6 b145a4d
Author: nicolezbur <nicolas.lezcano@gmail.com>
Date:   Sun Nov 1 13:20:33 2026 -0300

    Merge feature/usecases en  develop

[33mcommit b145a4d32d4f38af6e1f715b3b523ab143334b99[m[33m ([m[1;31morigin/feature/usecases[m[33m)[m
Author: nicolezbur <nicolas.lezcano@gmail.com>
Date:   Sun Nov 1 12:51:22 2026 -0300

    Agrega factory de DAOs y simplifica el container
    
    Nuevo dao/daoFactory.js elige el adaptador segun PERSISTENCE_TYPE

 container/container.js | 27 [32m+++++++[m[31m--------------------[m
 dao/daoFactory.js      | 28 [32m++++++++++++++++++++++++++++[m
 2 files changed, 35 insertions(+), 20 deletions(-)

[33mcommit a757f1d82bde11109d720c7f57f3222643050027[m
Author: nicolezbur <nicolas.lezcano@gmail.com>
Date:   Sun Nov 1 12:39:21 2026 -0300

    Relaciona turnos con usuarios y agrega reglas de negocio
    
    Crear turno exige que el usuario exista (404)
    
    No se puede eliminar al admin (409); al eliminar un usuario se borran sus turnos

 container/container.js                   |  6 [32m+++[m[31m---[m
 dao/memory/TurnosMemoryDao.js            |  7 [32m+++++++[m
 requests.http                            | 35 [32m+++++++++++++++++++++++++++++++[m[31m-[m
 usecases/turnos/createTurno.js           | 14 [32m++++++++++++[m[31m-[m
 usecases/turnos/makeTurnoUseCases.js     |  7 [32m+++[m[31m----[m
 usecases/usuarios/deleteUsuario.js       | 16 [32m+++++++++++++[m[31m--[m
 usecases/usuarios/makeUsuarioUseCases.js |  7 [32m++++[m[31m---[m
 7 files changed, 78 insertions(+), 14 deletions(-)

[33mcommit eff4efe8d559861115e9d272076eefd65c02e9f9[m
Author: nicolezbur <nicolas.lezcano@gmail.com>
Date:   Sun Nov 1 11:31:07 2026 -0300

    Agrega casos de uso de turnos y entidad usuarios
    
    Turnos: logica movida a usecases/turnos, el controller usa casos de uso inyectados desde el container
    
    Usuarios: nueva entidad con CRUD, email unico (409), sin devolver el password
    
    Seed de usuarios alineado con los clienteId de los turnos

 container/container.js                   | 22 [32m+++++++++[m[31m--[m
 controllers/turnosController.js          | 44 [32m+++++[m[31m----------------[m
 controllers/usuariosController.js        | 44 [32m+++++++++++++++++++++[m
 dao/memory/UsuariosMemoryDao.js          | 47 [32m++++++++++++++++++++++[m
 dao/memory/seed.js                       |  8 [32m++++[m
 requests.http                            | 64 [32m+++++++++++++++++++++++++++++[m[31m-[m
 routes/usuariosRoutes.js                 | 28 [32m+++++++++++++[m
 schemas/usuarioSchema.js                 | 67 [32m++++++++++++++++++++++++++++++++[m
 usecases/turnos/createTurno.js           |  9 [32m+++++[m
 usecases/turnos/deleteTurno.js           |  9 [32m+++++[m
 usecases/turnos/getTurnoById.js          |  9 [32m+++++[m
 usecases/turnos/getTurnos.js             | 35 [32m+++++++++++++++++[m
 usecases/turnos/makeTurnoUseCases.js     | 22 [32m+++++++++++[m
 usecases/turnos/updateTurno.js           |  9 [32m+++++[m
 usecases/usuarios/createUsuario.js       | 17 [32m++++++++[m
 usecases/usuarios/deleteUsuario.js       | 10 [32m+++++[m
 usecases/usuarios/getUsuarioById.js      | 11 [32m++++++[m
 usecases/usuarios/getUsuarios.js         | 18 [32m+++++++++[m
 usecases/usuarios/makeUsuarioUseCases.js | 20 [32m++++++++++[m
 usecases/usuarios/updateUsuario.js       | 19 [32m+++++++++[m
 usecases/usuarios/usuarioPublico.js      |  9 [32m+++++[m
 21 files changed, 482 insertions(+), 39 deletions(-)

[33mcommit 5ecb5e680436da74af99abfa4f0b0605cd921f9f[m
Merge: 7dc2e88 221fccb
Author: ricardom23581 <muller.ricardod@gmail.com>
Date:   Sat Oct 31 09:12:19 2026 -0300

    Merge feature/validacion-errores hacia develop

[33mcommit 221fccb8bfdf81ec6b4f15e75524dc8934a6e6bb[m[33m ([m[1;31morigin/feature/validacion-errores[m[33m, [m[1;32mfeature/validacion-errores[m[33m)[m
Author: ricardom23581 <muller.ricardod@gmail.com>
Date:   Sat Oct 31 09:09:17 2026 -0300

    Validacion con Zod (body, params, query), AppError y errorHandler centralizado

 controllers/turnosController.js |  82 [32m+++++++++++[m[31m---------------------[m
 errors/AppError.js              |  13 [32m++++++[m
 index.js                        |   6 [32m++[m[31m-[m
 middlewares/errorHandler.js     |  32 [32m+++++++++++++[m
 middlewares/notFound.js         |  19 [32m++++[m[31m----[m
 middlewares/validate.js         |  27 [32m+++++++++++[m
 requests.http                   |  63 [32m++++++++++++++++++++++++[m[31m-[m
 routes/turnosRoutes.js          |  30 [32m++++++++[m[31m----[m
 schemas/turnoSchema.js          | 101 [32m++++++++++++++++++++++++++++++++++++++++[m
 9 files changed, 298 insertions(+), 75 deletions(-)

[33mcommit 7dc2e88303383fae2586b233c2ddc2ffa57d67ad[m
Merge: acca618 aa1c034
Author: ricardom23581 <muller.ricardod@gmail.com>
Date:   Fri Oct 30 21:13:29 2026 -0300

    Merge feature/middlewares-rest hacia develop

[33mcommit aa1c034b4d55451b752aa02f37515117b675a552[m[33m ([m[1;31morigin/feature/middlewares-rest[m[33m, [m[1;32mfeature/middlewares-rest[m[33m)[m
Author: ricardom23581 <muller.ricardod@gmail.com>
Date:   Fri Oct 30 21:11:29 2026 -0300

    Middlewares, logger y notFound, filtros por query y formato de errores standar

 controllers/turnosController.js | 68 [32m++++++++++++++++++++++++++++++++[m[31m---------[m
 dao/memory/seed.js              | 14 [32m+++++++++[m
 index.js                        | 13 [32m++++++[m[31m--[m
 middlewares/logger.js           | 15 [32m+++++++++[m
 middlewares/notFound.js         | 12 [32m++++++++[m
 requests.http                   | 17 [32m++++++++++[m[31m-[m
 6 files changed, 121 insertions(+), 18 deletions(-)

[33mcommit acca61886288a746e485832bbaef6d0f1b9fa735[m
Merge: 8a8a17b 6194293
Author: ricardom23581 <muller.ricardod@gmail.com>
Date:   Fri Oct 30 20:51:55 2026 -0300

    Merge feature/express-turnos hacia develop

[33mcommit 6194293ebfe59cd2822c13b1ab509c6b084d384b[m[33m ([m[1;31morigin/feature/express-turnos[m[33m, [m[1;32mfeature/express-turnos[m[33m)[m
Author: ricardom23581 <muller.ricardod@gmail.com>
Date:   Fri Oct 30 18:11:38 2026 -0300

    CRUD de turnos con Express: DAO en memoria, controller y router

 container/container.js          | 20 [32m++++++++++[m[31m-----[m
 controllers/turnosController.js | 56 [32m+++++++++++++++++++++++++++++++++++++++++[m
 dao/memory/TurnosMemoryDao.js   | 41 [32m++++++++++++++++++++++++++++++[m
 dao/memory/seed.js              | 19 [32m++++++++++++++[m
 index.js                        |  7 [32m+++[m[31m---[m
 requests.http                   | 43 [32m++++++++++++++++++++++++++++++[m[31m-[m
 routes/turnosRoutes.js          | 19 [32m++++++++++++++[m
 7 files changed, 194 insertions(+), 11 deletions(-)

[33mcommit 8a8a17b199659265b2bb870ea7d230772547b8d3[m
Author: ricardom23581 <muller.ricardod@gmail.com>
Date:   Thu Oct 29 09:34:50 2026 -0300

    Inicio del proyecto lavadero. Generacion de Arquitectura.

 .env.example           |    3 [32m+[m
 .gitignore             |    3 [32m+[m
 config/config.js       |   11 [32m+[m
 container/container.js |   27 [32m+[m
 index.js               |   22 [32m+[m
 package-lock.json      | 1760 [32m++++++++++++++++++++++++++++++++++++++++++++++++[m
 package.json           |   22 [32m+[m
 requests.http          |    2 [32m+[m
 8 files changed, 1850 insertions(+)
