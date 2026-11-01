import getUsuarios from "./getUsuarios.js";
import getUsuarioById from "./getUsuarioById.js";
import createUsuario from "./createUsuario.js";
import updateUsuario from "./updateUsuario.js";
import deleteUsuario from "./deleteUsuario.js";

/**
 * Factory de casos de uso de usuarios.
 * Recibe el DAO de usuarios y el de turnos (para borrar sus turnos al eliminar).
 */
function makeUsuarioUseCases(dao, turnosDao) {
  return {
    getUsuarios: (filters) => getUsuarios(filters, dao),
    getUsuarioById: (id) => getUsuarioById(id, dao),
    createUsuario: (data) => createUsuario(data, dao),
    updateUsuario: (id, cambios) => updateUsuario(id, cambios, dao),
    deleteUsuario: (id) => deleteUsuario(id, dao, turnosDao),
  };
}

export default makeUsuarioUseCases;