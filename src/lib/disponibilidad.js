// "09:30" -> 570 minutos desde medianoche
function horaAMinutos(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

// Un Date -> minutos desde medianoche en el día de referencia
function fechaAMinutosDelDia(fecha, diaRef) {
  const inicioDia = new Date(diaRef);
  inicioDia.setHours(0, 0, 0, 0);
  const finDia = new Date(diaRef);
  finDia.setHours(23, 59, 59, 999);
  if (fecha < inicioDia) return 0;
  if (fecha > finDia) return 24 * 60;
  return (fecha - inicioDia) / 60000;
}

// Fusiona intervalos ocupados solapados
function fusionarOcupados(intervalos) {
  if (intervalos.length === 0) return [];
  const orden = [...intervalos].sort((a, b) => a.inicio - b.inicio);
  const fusion = [orden[0]];
  for (let i = 1; i < orden.length; i++) {
    const ultimo = fusion[fusion.length - 1];
    const actual = orden[i];
    if (actual.inicio <= ultimo.fin) {
      ultimo.fin = Math.max(ultimo.fin, actual.fin);
    } else {
      fusion.push(actual);
    }
  }
  return fusion;
}

// minutos desde medianoche -> Date en ese día
function minutosADate(dia, minutos) {
  const d = new Date(dia);
  d.setHours(0, 0, 0, 0);
  d.setMinutes(minutos);
  return d;
}

export function calcularHuecos({
  dia,
  duracionMin,
  horarios = [],
  reservas = [],
  bloqueos = [],
  paso = 15,
  margenMin = 0,
  ahora = new Date(),
}) {
  const diaSemana = dia.getDay(); // 0 = domingo

  const franjas = horarios
    .filter((h) => h.dia_semana === diaSemana)
    .map((h) => ({
      inicio: horaAMinutos(h.hora_inicio),
      fin: horaAMinutos(h.hora_fin),
    }))
    .sort((a, b) => a.inicio - b.inicio);

  if (franjas.length === 0) return [];

  const ocupados = fusionarOcupados(
    [...reservas, ...bloqueos]
      .map((r) => ({
        inicio: fechaAMinutosDelDia(r.inicio, dia),
        fin: fechaAMinutosDelDia(r.fin, dia),
      }))
      .filter((r) => r.fin > r.inicio)
  );

  let sueloMin = 0;
  const inicioDia = new Date(dia);
  inicioDia.setHours(0, 0, 0, 0);
  if (ahora >= inicioDia) {
    const finDia = new Date(dia);
    finDia.setHours(23, 59, 59, 999);
    if (ahora <= finDia) {
      sueloMin = (ahora - inicioDia) / 60000 + margenMin;
    }
  }

  const huecos = [];
  for (const franja of franjas) {
    let cursor = Math.max(franja.inicio, sueloMin);
    if (cursor % paso !== 0) cursor += paso - (cursor % paso);

    while (cursor + duracionMin <= franja.fin) {
      const propInicio = cursor;
      const propFin = cursor + duracionMin;
      const pisa = ocupados.some(
        (o) => propInicio < o.fin && propFin > o.inicio
      );
      if (!pisa) {
        huecos.push({
          inicio: minutosADate(dia, propInicio),
          fin: minutosADate(dia, propFin),
        });
      }
      cursor += paso;
    }
  }
  return huecos;
}