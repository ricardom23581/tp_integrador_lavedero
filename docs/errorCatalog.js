const ERROR_CATALOG = {
  VALIDACION: [400, "Los datos enviados no cumplen el esquema de validación"],
  JSON_INVALIDO: [400, "El body no es un JSON válido"],
  TOKEN_FALTANTE: [401, "Falta el header Authorization: Bearer <token>"],
  TOKEN_INVALIDO: [401, "Token inválido"],
  TOKEN_VENCIDO: [401, "El token venció, iniciá sesión de nuevo"],
  PROHIBIDO: [403, "No tenés permiso para realizar esta acción"],
  TURNO_NO_ENCONTRADO: [404, "No existe un turno con ese id"],
  USUARIO_NO_ENCONTRADO: [404, "No existe un usuario con ese id"],
  RUTA_NO_ENCONTRADA: [404, "No existe la ruta solicitada"],
  EMAIL_DUPLICADO: [409, "Ese email ya está registrado"],
  ADMIN_NO_ELIMINABLE: [409, "No se puede eliminar a un administrador"],
  PATENTE_CON_TURNO_PENDIENTE: [409, "Ya existe un turno pendiente para esa patente"],
  CLIENTE_CON_AUSENCIAS: [409, "El cliente tiene un turno ausente sin resolver"],
  LIMITE_TURNOS_PENDIENTES: [409, "El cliente alcanzó el límite de turnos pendientes"],
  TURNO_YA_ATENDIDO: [409, "No se puede reprogramar un turno ya atendido"],
  TURNO_AUSENTE: [409, "No se puede reprogramar un turno ausente"],
  LIMITE_REPROGRAMACIONES: [409, "El turno alcanzó el límite de reprogramaciones"],
  TURNO_CAMBIO: [409, "El turno cambió mientras se procesaba el pedido"],
  FECHA_PASADA: [422, "La fecha del turno ya pasó"],
  FECHA_FUERA_DE_RANGO: [422, "La fecha supera el rango de anticipación permitido"],
  FECHA_FERIADO: [422, "El lavadero permanece cerrado durante el feriado"],
  CREDENCIALES_INVALIDAS: [401, "Email o contraseña incorrectos"],
  DEMASIADOS_INTENTOS: [429, "Se superó el límite de intentos fallidos"],
  EXTERNAL_API_ERROR: [502, "No se pudo consultar el calendario de feriados"],
  EXTERNAL_TIMEOUT: [504, "El calendario de feriados tardó demasiado en responder"],
  ERROR_INTERNO: [500, "Ocurrió un error inesperado en el servidor"],
};

function errorExample(code) {
  const entry = ERROR_CATALOG[code];
  if (!entry) throw new Error(`Código de error sin documentar en errorCatalog.js: ${code}`);
  const [, message] = entry;
  return { error: { code, message } };
}

export { ERROR_CATALOG, errorExample };
