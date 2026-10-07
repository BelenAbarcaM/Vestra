// =====================================================================
// utilTipoUsuario
// -----------------------------------------------------------------
// Los tipos de usuario vienen de la base de datos así:
//   1 = Estudiante
//   2 = Profesor
//   3 = Visitante
// (ver backend/api/registro.php)
//
// Este helper lee ese valor sin importar cómo lo llame exactamente
// el backend en el JSON (Tipo_usuario, tipo_usuario, etc.), para
// que un cambio de mayúsculas en el PHP no rompa el frontend.
// =====================================================================

export function extraerTipoUsuario(objeto) {
  if (!objeto) return null;

  const valor =
    objeto.tipo_usuario ??
    objeto.Tipo_usuario ??
    objeto.tipoUsuario ??
    objeto.id_tipo_usuario ??
    objeto.tipo ??
    objeto.Tipo ??
    null;

  return valor !== null ? String(valor) : null;
}

export const TIPO_ESTUDIANTE = '1';
export const TIPO_PROFESOR = '2';
export const TIPO_VISITANTE = '3';

export function esVisitante(tipo) {
  return String(tipo) === TIPO_VISITANTE;
}
