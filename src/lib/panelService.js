import { supabase } from './supabase';

const CAMPOS_RESERVA = `
  id,
  inicio,
  fin,
  estado,
  cliente_nombre,
  cliente_email,
  servicio_id,
  empleado_id,
  servicios ( nombre ),
  empleados ( nombre )
`;

/** Reservas cuyo inicio cae en [desde, hasta). */
export async function listarReservasEntre(desde, hasta) {
  const { data, error } = await supabase
    .from('reservas')
    .select(CAMPOS_RESERVA)
    .gte('inicio', desde.toISOString())
    .lt('inicio', hasta.toISOString())
    .order('inicio', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function listarEmpleados({ soloActivos = true } = {}) {
  let consulta = supabase.from('empleados').select('id, nombre, activo');
  if (soloActivos) consulta = consulta.eq('activo', true);

  const { data, error } = await consulta.order('nombre', { ascending: true });
  if (error) throw error;
  return data ?? [];
}