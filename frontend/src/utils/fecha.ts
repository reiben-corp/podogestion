/**
 * Utilidades de formato para mostrar datos en la UI
 */

/**
 * Formatea una fecha (YYYY-MM-DD, YYYY-MM-DD HH:MM:SS o ISO datetime) a DD/MM/AA
 */
export function formatearFecha(fecha: string | Date | null | undefined): string {
  if (!fecha) return '—';
  
  let f: Date;
  if (typeof fecha === 'string') {
    // Extraer solo la parte de la fecha (sin hora) para normalizar
    // Acepta: YYYY-MM-DD, YYYY-MM-DD HH:MM:SS, YYYY-MM-DDTHH:MM:SS
    const fechaStr = fecha.includes(' ') ? fecha.split(' ')[0] : 
                     fecha.includes('T') ? fecha.split('T')[0] : fecha;
    f = new Date(fechaStr + 'T00:00:00');
  } else {
    f = fecha;
  }
  
  if (isNaN(f.getTime())) return '—';
  
  const dia = String(f.getDate()).padStart(2, '0');
  const mes = String(f.getMonth() + 1).padStart(2, '0');
  const anio = String(f.getFullYear()).slice(-2);
  
  return `${dia}/${mes}/${anio}`;
}

/**
 * Formatea fecha ISO (con hora) a DD/MM/AA HH:MM
 */
export function formatearFechaHora(fecha: string | Date | null | undefined): string {
  if (!fecha) return '—';
  
  const f = typeof fecha === 'string' ? new Date(fecha) : fecha;
  if (isNaN(f.getTime())) return '—';
  
  const fechaStr = formatearFecha(f);
  const hora = String(f.getHours()).padStart(2, '0');
  const min = String(f.getMinutes()).padStart(2, '0');
  
  return `${fechaStr} ${hora}:${min}`;
}

/**
 * Capitaliza la primera letra de cada palabra
 */
export function capitalizar(texto: string): string {
  if (!texto) return '';
  return texto
    .split(' ')
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Muestra el estado civil en formato legible
 */
export function formatearEstadoCivil(estado: string | null | undefined): string {
  if (!estado) return '—';
  
  const estados: Record<string, string> = {
    'soltero': 'Soltero/a',
    'casado': 'Casado/a',
    'divorciado': 'Divorciado/a',
    'viudo': 'Viudo/a',
    'pareja_hecho': 'Pareja de hecho',
  };
  
  return estados[estado.toLowerCase()] || capitalizar(estado.replace('_', ' '));
}

/**
 * Muestra el sexo en formato legible
 */
export function formatearSexo(sexo: string | null | undefined): string {
  if (!sexo) return '—';
  
  const sexos: Record<string, string> = {
    'masculino': 'Masculino',
    'femenino': 'Femenino',
    'otro': 'Otro',
  };
  
  return sexos[sexo.toLowerCase()] || capitalizar(sexo);
}

/**
 * Devuelve la fecha de hoy en formato YYYY-MM-DD para inputs date
 */
export function toFechaLocal(fecha: string | Date | null | undefined): string {
  if (!fecha) return '';
  const f = typeof fecha === 'string' ? new Date(fecha) : fecha;
  if (isNaN(f.getTime())) return '';
  const dia = String(f.getDate()).padStart(2, '0');
  const mes = String(f.getMonth() + 1).padStart(2, '0');
  return `${f.getFullYear()}-${mes}-${dia}`;
}

export function getFechaHoy(): string {
  const f = new Date();
  const dia = String(f.getDate()).padStart(2, '0');
  const mes = String(f.getMonth() + 1).padStart(2, '0');
  return `${f.getFullYear()}-${mes}-${dia}`;
}

/**
 * Convierte YYYY-MM-DD a formato para input date (ya está bien)
 */
export function toFechaInput(fecha: string | null | undefined): string {
  if (!fecha) return '';
  return fecha;
}
