// Utilidades de fecha para el panel.
// Todo se calcula en la hora local del navegador.

export const NOMBRES_DIA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

/** Lunes a las 00:00 de la semana a la que pertenece `fecha`. */
export function inicioDeSemana(fecha) {
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  const diaSemana = (d.getDay() + 6) % 7; // 0 = lunes ... 6 = domingo
  d.setDate(d.getDate() - diaSemana);
  return d;
}

export function sumarDias(fecha, n) {
  const d = new Date(fecha);
  d.setDate(d.getDate() + n);
  return d;
}

export function diasDeLaSemana(lunes) {
  return Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));
}

export function mismoDia(a, b) {
  const x = new Date(a);
  const y = new Date(b);
  return (
    x.getFullYear() === y.getFullYear() &&
    x.getMonth() === y.getMonth() &&
    x.getDate() === y.getDate()
  );
}

export function minutosDesdeMedianoche(fecha) {
  const d = new Date(fecha);
  return d.getHours() * 60 + d.getMinutes();
}

export function formatoHora(fecha) {
  return new Date(fecha).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatoFechaLarga(fecha) {
  return new Date(fecha).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/** "4 – 10 de agosto de 2026" */
export function rangoSemanaTexto(lunes) {
  const domingo = sumarDias(lunes, 6);
  const mismoMes = lunes.getMonth() === domingo.getMonth();
  const izq = mismoMes
    ? lunes.getDate()
    : lunes.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  const der = domingo.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return `${izq} – ${der}`;
}