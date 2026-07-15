import { supabase } from './supabase.js';
import { calcularHuecos } from './disponibilidad.js';

export async function getServicios(negocioSlug) {
  const { data: negocio, error: e1 } = await supabase
    .from('negocios')
    .select('id')
    .eq('slug', negocioSlug)
    .single();
  if (e1) throw e1;

  const { data, error } = await supabase
    .from('servicios')
    .select('*')
    .eq('negocio_id', negocio.id)
    .eq('activo', true)
    .order('nombre');
  if (error) throw error;
  return { negocioId: negocio.id, servicios: data };
}

export async function getEmpleados(negocioId) {
  const { data, error } = await supabase
    .from('empleados')
    .select('*')
    .eq('negocio_id', negocioId)
    .eq('activo', true)
    .order('nombre');
  if (error) throw error;
  return data;
}

export async function getHuecosDisponibles({ empleadoId, servicio, dia }) {
  const inicioDia = new Date(dia); inicioDia.setHours(0, 0, 0, 0);
  const finDia = new Date(dia); finDia.setHours(23, 59, 59, 999);

  const [horariosRes, reservasRes, bloqueosRes] = await Promise.all([
    supabase.from('horarios').select('*').eq('empleado_id', empleadoId),
    supabase
      .from('reservas')
      .select('inicio, fin')
      .eq('empleado_id', empleadoId)
      .eq('estado', 'confirmada')
      .gte('inicio', inicioDia.toISOString())
      .lte('inicio', finDia.toISOString()),
    supabase
      .from('bloqueos')
      .select('inicio, fin')
      .eq('empleado_id', empleadoId)
      .lte('inicio', finDia.toISOString())
      .gte('fin', inicioDia.toISOString()),
  ]);

  if (horariosRes.error) throw horariosRes.error;
  if (reservasRes.error) throw reservasRes.error;
  if (bloqueosRes.error) throw bloqueosRes.error;

  return calcularHuecos({
    dia,
    duracionMin: servicio.duracion_min,
    horarios: horariosRes.data,
    reservas: reservasRes.data.map((r) => ({
      inicio: new Date(r.inicio),
      fin: new Date(r.fin),
    })),
    bloqueos: bloqueosRes.data.map((b) => ({
      inicio: new Date(b.inicio),
      fin: new Date(b.fin),
    })),
    paso: 15,
    margenMin: 60,
  });
}

export async function crearReserva({ negocioId, servicio, empleadoId, inicio, cliente }) {
  const fin = new Date(inicio.getTime() + servicio.duracion_min * 60000);

  const huecos = await getHuecosDisponibles({ empleadoId, servicio, dia: inicio });
  const sigueLibre = huecos.some((h) => h.inicio.getTime() === inicio.getTime());
  if (!sigueLibre) {
    throw new Error('Ese hueco acaba de ocuparse. Elige otro, por favor.');
  }

  const { data, error } = await supabase
    .from('reservas')
    .insert({
      negocio_id: negocioId,
      servicio_id: servicio.id,
      empleado_id: empleadoId,
      cliente_nombre: cliente.nombre,
      cliente_email: cliente.email,
      cliente_telefono: cliente.telefono ?? null,
      inicio: inicio.toISOString(),
      fin: fin.toISOString(),
      estado: 'confirmada',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}