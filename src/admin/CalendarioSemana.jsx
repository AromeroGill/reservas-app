import {
  NOMBRES_DIA,
  diasDeLaSemana,
  mismoDia,
  minutosDesdeMedianoche,
  formatoHora,
} from '../lib/fechas';
import './calendario.css';

const ALTO_HORA = 56; // debe coincidir con el CSS

/** Reparte las reservas de un día en carriles para que no se solapen. */
function repartirEnCarriles(reservasDelDia) {
  const finPorCarril = [];
  const items = reservasDelDia.map((reserva) => {
    const ini = new Date(reserva.inicio).getTime();
    const fin = new Date(reserva.fin).getTime();
    let carril = finPorCarril.findIndex((f) => f <= ini);
    if (carril === -1) {
      finPorCarril.push(fin);
      carril = finPorCarril.length - 1;
    } else {
      finPorCarril[carril] = fin;
    }
    return { reserva, carril };
  });
  return { items, carriles: Math.max(finPorCarril.length, 1) };
}

export default function CalendarioSemana({
  lunes,
  reservas,
  horaInicio = 8,
  horaFin = 21,
  seleccionadaId = null,
  onSeleccionar = () => {},
}) {
  const dias = diasDeLaSemana(lunes);
  const alto = (horaFin - horaInicio) * ALTO_HORA;
  const horas = Array.from({ length: horaFin - horaInicio }, (_, i) => horaInicio + i);
  const hoy = new Date();

  return (
    <div className="cal-marco">
      <div className="cal-cabecera">
        <div />
        {dias.map((d, i) => (
          <div key={i} className={mismoDia(d, hoy) ? 'cal-hoy' : undefined}>
            {NOMBRES_DIA[i]} {d.getDate()}
          </div>
        ))}
      </div>

      <div className="cal-cuerpo">
        <div className="cal-horas" style={{ height: alto }}>
          {horas.map((h) => (
            <div key={h} className="cal-hora">
              {String(h).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {dias.map((dia, i) => {
          const delDia = reservas.filter((r) => mismoDia(r.inicio, dia));
          const { items, carriles } = repartirEnCarriles(delDia);

          return (
            <div key={i} className="cal-dia" style={{ height: alto }}>
              {items.map(({ reserva, carril }) => {
                const minIni = minutosDesdeMedianoche(reserva.inicio);
                const minFin = minutosDesdeMedianoche(reserva.fin);
                const top = ((minIni - horaInicio * 60) / 60) * ALTO_HORA;
                const altoCita = Math.max(((minFin - minIni) / 60) * ALTO_HORA, 20);
                const ancho = 100 / carriles;

                return (
                  <button
                    key={reserva.id}
                    type="button"
                    onClick={() => onSeleccionar(reserva)}
                    className={[
                      'cal-cita',
                      reserva.estado,
                      seleccionadaId === reserva.id ? 'sel' : '',
                    ].join(' ')}
                    style={{
                      top: Math.max(top, 0),
                      height: altoCita,
                      left: `calc(${carril * ancho}% + 2px)`,
                      width: `calc(${ancho}% - 4px)`,
                    }}
                    title={`${formatoHora(reserva.inicio)} · ${reserva.cliente_nombre}`}
                  >
                    <strong>{formatoHora(reserva.inicio)} {reserva.cliente_nombre}</strong>
                    <span>
                      {reserva.servicios?.nombre}
                      {reserva.empleados?.nombre ? ` · ${reserva.empleados.nombre}` : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}