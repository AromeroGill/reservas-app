import { useEffect, useMemo, useState } from 'react';
import CalendarioSemana from './CalendarioSemana';
import { listarReservasEntre, listarEmpleados } from '../lib/panelService';
import { inicioDeSemana, sumarDias, rangoSemanaTexto } from '../lib/fechas';

export default function AgendaSemana() {
  const [lunes, setLunes] = useState(() => inicioDeSemana(new Date()));
  const [reservas, setReservas] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [empleadoId, setEmpleadoId] = useState('todos');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [seleccionada, setSeleccionada] = useState(null);

  useEffect(() => {
    listarEmpleados()
      .then(setEmpleados)
      .catch((e) => console.error('Error cargando empleados:', e));
  }, []);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setError(null);

    listarReservasEntre(lunes, sumarDias(lunes, 7))
      .then((datos) => { if (!cancelado) setReservas(datos); })
      .catch((e) => { if (!cancelado) setError(e.message ?? 'Error desconocido'); })
      .finally(() => { if (!cancelado) setCargando(false); });

    return () => { cancelado = true; };
  }, [lunes]);

  const visibles = useMemo(
    () => (empleadoId === 'todos'
      ? reservas
      : reservas.filter((r) => r.empleado_id === empleadoId)),
    [reservas, empleadoId]
  );

  return (
    <section>
      <div className="cal-barra">
        <button className="cal-boton" onClick={() => setLunes(sumarDias(lunes, -7))}>←</button>
        <button className="cal-boton" onClick={() => setLunes(inicioDeSemana(new Date()))}>Hoy</button>
        <button className="cal-boton" onClick={() => setLunes(sumarDias(lunes, 7))}>→</button>

        <h2>{rangoSemanaTexto(lunes)}</h2>

        <select
          className="cal-select"
          value={empleadoId}
          onChange={(e) => setEmpleadoId(e.target.value)}
        >
          <option value="todos">Todos los empleados</option>
          {empleados.map((emp) => (
            <option key={emp.id} value={emp.id}>{emp.nombre}</option>
          ))}
        </select>
      </div>

      {error && <p style={{ color: '#b3261e' }}>No se han podido cargar las reservas: {error}</p>}
      {cargando && <p>Cargando agenda…</p>}

      <CalendarioSemana
        lunes={lunes}
        reservas={visibles}
        seleccionadaId={seleccionada?.id ?? null}
        onSeleccionar={setSeleccionada}
      />

      {seleccionada && (
        <p style={{ marginTop: '1rem', fontSize: '0.85rem', opacity: 0.7 }}>
          Seleccionada: {seleccionada.cliente_nombre} ({seleccionada.estado})
        </p>
      )}
    </section>
  );
}