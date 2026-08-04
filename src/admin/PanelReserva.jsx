import { useEffect, useState } from 'react';
import { formatoFechaLarga, formatoHora } from '../lib/fechas';
import { actualizarReserva, ESTADOS, ETIQUETA_ESTADO } from '../lib/panelService';

/** Date -> "2026-08-04T10:30" para <input type="datetime-local"> */
function aInputLocal(fecha) {
  const d = new Date(fecha);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function PanelReserva({ reserva, reservasSemana, onCerrar, onGuardada }) {
  const [nuevoInicio, setNuevoInicio] = useState(() => aInputLocal(reserva.inicio));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setNuevoInicio(aInputLocal(reserva.inicio));
    setError(null);
  }, [reserva.id, reserva.inicio]);

  const duracionMs = new Date(reserva.fin) - new Date(reserva.inicio);

  function haySolape(iniMs, finMs) {
    return reservasSemana.some((r) => {
      if (r.id === reserva.id) return false;
      if (r.empleado_id !== reserva.empleado_id) return false;
      if (r.estado === 'cancelada') return false;
      const a = new Date(r.inicio).getTime();
      const b = new Date(r.fin).getTime();
      return iniMs < b && finMs > a;
    });
  }

  async function guardar(cambios) {
    setGuardando(true);
    setError(null);
    try {
      const actualizada = await actualizarReserva(reserva.id, cambios);
      onGuardada(actualizada);
    } catch (e) {
      setError(e.message ?? 'No se ha podido guardar');
    } finally {
      setGuardando(false);
    }
  }

  function moverHora() {
    const ini = new Date(nuevoInicio);
    if (Number.isNaN(ini.getTime())) {
      setError('Fecha u hora no válida');
      return;
    }
    const fin = new Date(ini.getTime() + duracionMs);
    if (haySolape(ini.getTime(), fin.getTime())) {
      setError('Ese hueco ya está ocupado por otra cita del mismo empleado');
      return;
    }
    guardar({ inicio: ini.toISOString(), fin: fin.toISOString() });
  }

  function cancelarCita() {
    if (!window.confirm(`¿Cancelar la cita de ${reserva.cliente_nombre}?`)) return;
    guardar({ estado: 'cancelada' });
  }

  return (
    <aside className="pr-panel">
      <header className="pr-cabecera">
        <h3>{reserva.cliente_nombre}</h3>
        <button className="cal-boton" onClick={onCerrar} aria-label="Cerrar">✕</button>
      </header>

      <dl className="pr-datos">
        <dt>Cuándo</dt>
        <dd>
          {formatoFechaLarga(reserva.inicio)}<br />
          {formatoHora(reserva.inicio)} – {formatoHora(reserva.fin)}
        </dd>

        <dt>Servicio</dt>
        <dd>{reserva.servicios?.nombre ?? '—'}</dd>

        <dt>Empleado</dt>
        <dd>{reserva.empleados?.nombre ?? '—'}</dd>

        <dt>Email</dt>
        <dd><a href={`mailto:${reserva.cliente_email}`}>{reserva.cliente_email}</a></dd>
      </dl>

      <label className="pr-campo">
        <span>Estado</span>
        <select
          className="cal-select"
          value={reserva.estado}
          disabled={guardando}
          onChange={(e) => guardar({ estado: e.target.value })}
        >
          {ESTADOS.map((e) => (
            <option key={e} value={e}>{ETIQUETA_ESTADO[e]}</option>
          ))}
        </select>
      </label>

      <label className="pr-campo">
        <span>Mover a</span>
        <input
          type="datetime-local"
          className="cal-select"
          value={nuevoInicio}
          disabled={guardando}
          onChange={(e) => setNuevoInicio(e.target.value)}
        />
      </label>

      <div className="pr-acciones">
        <button className="cal-boton" onClick={moverHora} disabled={guardando}>
          Mover cita
        </button>
        <button
          className="cal-boton pr-peligro"
          onClick={cancelarCita}
          disabled={guardando || reserva.estado === 'cancelada'}
        >
          Cancelar cita
        </button>
      </div>

      {guardando && <p className="pr-aviso">Guardando…</p>}
      {error && <p className="pr-aviso pr-error">{error}</p>}
    </aside>
  );
}