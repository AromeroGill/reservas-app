import { useCallback, useEffect, useMemo, useState } from 'react';
import CalendarioSemana from './CalendarioSemana';
import PanelReserva from './PanelReserva';
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

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setReservas(await listarReservasEntre(lunes, sumarDias(lunes, 7)));
    } catch (e) {
      setError(e.message ?? 'Error desconocido');
    } finally {
      setCargando(false);
    }
  }, [lunes]);

  useEffect(() => { cargar(); }, [cargar]);

  const visibles = useMemo(
    () => (empleadoId === 'todos'
      ? reservas
      : reservas.filter((r) => r.empleado_id === empleadoId)),
    [reservas, empleadoId]
  );

  function alGuardar(actualizada) {
    setSeleccionada(actualizada);
    cargar();
  }

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
        <PanelReserva
          reserva={seleccionada}
          reservasSemana={reservas}
          onCerrar={() => setSeleccionada(null)}
          onGuardada={alGuardar}
        />
      )}
    </section>
  );
}