import { useState, useEffect } from 'react';
import {
  getServicios,
  getEmpleados,
  getHuecosDisponibles,
  crearReserva,
} from './lib/reservasService.js';

// Cambia esto por el slug de tu negocio
const NEGOCIO_SLUG = 'peluqueria-demo';

export default function PaginaReserva() {
  const [negocioId, setNegocioId] = useState(null);
  const [servicios, setServicios] = useState([]);
  const [empleados, setEmpleados] = useState([]);

  const [servicio, setServicio] = useState(null);
  const [empleadoId, setEmpleadoId] = useState(null);
  const [dia, setDia] = useState(hoyISO());
  const [huecos, setHuecos] = useState([]);
  const [huecoElegido, setHuecoElegido] = useState(null);

  const [cliente, setCliente] = useState({ nombre: '', email: '', telefono: '' });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [confirmada, setConfirmada] = useState(null);

  // 1. Cargar servicios al inicio
  useEffect(() => {
    getServicios(NEGOCIO_SLUG)
      .then(({ negocioId, servicios }) => {
        setNegocioId(negocioId);
        setServicios(servicios);
      })
      .catch((e) => setError('No se pudo cargar el negocio: ' + e.message));
  }, []);

  // 2. Cargar empleados cuando hay negocio
  useEffect(() => {
    if (!negocioId) return;
    getEmpleados(negocioId).then(setEmpleados).catch(console.error);
  }, [negocioId]);

  // 3. Recalcular huecos cuando cambian servicio, empleado o día
  useEffect(() => {
    if (!servicio || !empleadoId || !dia) {
      setHuecos([]);
      return;
    }
    setCargando(true);
    setHuecoElegido(null);
    getHuecosDisponibles({
      empleadoId,
      servicio,
      dia: new Date(dia + 'T12:00:00'),
    })
      .then(setHuecos)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, [servicio, empleadoId, dia]);

  async function confirmar() {
    setError('');
    if (!cliente.nombre || !cliente.email) {
      setError('Nombre y email son obligatorios.');
      return;
    }
    setCargando(true);
    try {
      const reserva = await crearReserva({
        negocioId,
        servicio,
        empleadoId,
        inicio: huecoElegido,
        cliente,
      });
      setConfirmada(reserva);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  // Pantalla de confirmación
  if (confirmada) {
    return (
      <div className="reserva-container confirmada">
        <div className="reserva-body">
          <div className="confirmada-icono">✓</div>
          <h2>Reserva confirmada</h2>
          <p>
            <span className="destacado">{servicio.nombre}</span> el{' '}
            <span className="destacado">
              {new Date(confirmada.inicio).toLocaleString('es-ES', {
                weekday: 'long', day: 'numeric', month: 'long',
                hour: '2-digit', minute: '2-digit',
              })}
            </span>.
          </p>
          <p>Te hemos enviado un correo de confirmación a {confirmada.cliente_email}.</p>
        </div>
      </div>
    );
  }

return (
    <div className="reserva-container">
      <div className="reserva-header">
        <p className="eyebrow">Peluquería Demo</p>
        <h1>Reserva tu cita</h1>
        <p className="header-texto">
          Reservar es rápido y sin llamadas. Elige lo que necesitas y te
          confirmamos al momento por correo.
        </p>
      </div>

      <div className="reserva-body">
        <p className="subtitulo">
          Elige el servicio, el día y la hora que mejor te venga. Recibirás la
          confirmación al instante.
        </p>

        {error && <p className="error">{error}</p>}

        {/* Paso 1: servicio */}
        <div className="paso">
          <div className="paso-label"><span className="paso-num">1</span> Servicio</div>
          <select
            value={servicio?.id ?? ''}
            onChange={(e) =>
              setServicio(servicios.find((s) => s.id === e.target.value) ?? null)
            }
          >
            <option value="">Elige un servicio</option>
            {servicios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre} ({s.duracion_min} min{s.precio ? ` · ${s.precio}€` : ''})
              </option>
            ))}
          </select>
        </div>

        {/* Paso 2: empleado */}
        <div className="paso">
          <div className="paso-label"><span className="paso-num">2</span> Profesional</div>
          <select
            value={empleadoId ?? ''}
            onChange={(e) => setEmpleadoId(e.target.value || null)}
          >
            <option value="">Elige profesional</option>
            {empleados.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.nombre}</option>
            ))}
          </select>
        </div>

        {/* Paso 3: día */}
        <div className="paso">
          <div className="paso-label"><span className="paso-num">3</span> Día</div>
          <input
            type="date"
            value={dia}
            min={hoyISO()}
            onChange={(e) => setDia(e.target.value)}
          />
        </div>

        {/* Paso 4: huecos */}
        {servicio && empleadoId && (
          <div className="paso huecos">
            <div className="paso-label"><span className="paso-num">4</span> Hora</div>
            {cargando && <p className="mensaje-vacio">Buscando horas disponibles…</p>}
            {!cargando && huecos.length === 0 && (
              <p className="mensaje-vacio">No quedan horas libres ese día. Prueba con otra fecha.</p>
            )}
            <div className="huecos-grid">
              {huecos.map((h) => {
                const activo = huecoElegido?.getTime() === h.inicio.getTime();
                return (
                  <button
                    key={h.inicio.toISOString()}
                    className={activo ? 'hueco activo' : 'hueco'}
                    onClick={() => setHuecoElegido(h.inicio)}
                  >
                    {h.inicio.toLocaleTimeString('es-ES', {
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Paso 5: datos del cliente */}
        {huecoElegido && (
          <div className="datos-cliente">
            <div className="paso-label"><span className="paso-num">5</span> Tus datos</div>
            <label htmlFor="nombre" className="mensaje-vacio" style={{marginTop:0}}>Nombre</label>
            <input
              id="nombre"
              type="text"
              value={cliente.nombre}
              onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })}
            />
            <label htmlFor="email" className="mensaje-vacio">Email</label>
            <input
              id="email"
              type="email"
              value={cliente.email}
              onChange={(e) => setCliente({ ...cliente, email: e.target.value })}
            />
            <label htmlFor="tel" className="mensaje-vacio">Teléfono (opcional)</label>
            <input
              id="tel"
              type="text"
              value={cliente.telefono}
              onChange={(e) => setCliente({ ...cliente, telefono: e.target.value })}
            />

            <div className="resumen">
              Vas a reservar <strong>{servicio.nombre}</strong> el{' '}
              <strong>
                {huecoElegido.toLocaleString('es-ES', {
                  weekday: 'long', day: 'numeric', month: 'long',
                  hour: '2-digit', minute: '2-digit',
                })}
              </strong>.
            </div>

            <button className="confirmar" disabled={cargando} onClick={confirmar}>
              {cargando ? 'Confirmando…' : 'Confirmar reserva'}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // Fecha de hoy en formato YYYY-MM-DD
  function hoyISO() {
    return new Date().toISOString().split('T')[0];
  }
}