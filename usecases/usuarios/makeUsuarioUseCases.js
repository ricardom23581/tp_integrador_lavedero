import getUsuarios from "./getUsuarios.js";
import getUsuarioById from "./getUsuarioById.js";
import createUsuario from "./createUsuario.js";
import updateUsuario from "./updateUsuario.js";
import deleteUsuario from "./deleteUsuario.js";

/**
 * Factory de casos de uso de usuarios: inyecta el DAO en cada uno.
 */
function makeUsuarioUseCases(dao) {
  return {
    getUsuarios: (filters) => getUsuarios(filters, dao),
    getUsuarioById: (id) => getUsuarioById(id, dao),
    createUsuario: (data) => createUsuario(data, dao),
    updateUsuario: (id, cambios) => updateUsuario(id, cambios, dao),
    deleteUsuario: (id) => deleteUsuario(id, dao),
  };
}

export default makeUsuarioUseCases;