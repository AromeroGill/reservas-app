import { describe, it, expect } from 'vitest';
import { calcularHuecos } from './disponibilidad.js';

const MIERCOLES = new Date('2026-07-15T12:00:00'); // getDay() === 3
const AHORA_TEMPRANO = new Date('2026-07-15T00:00:00');
const horarioManana = [{ dia_semana: 3, hora_inicio: '09:00', hora_fin: '13:00' }];

describe('calcularHuecos', () => {
  it('genera huecos alineados al paso en una franja libre', () => {
    const huecos = calcularHuecos({
      dia: MIERCOLES, duracionMin: 60, horarios: horarioManana,
      paso: 30, ahora: AHORA_TEMPRANO,
    });
    expect(huecos.length).toBe(7);
    expect(huecos[0].inicio.getHours()).toBe(9);
  });

  it('excluye huecos que pisan una reserva existente', () => {
    const reservas = [{ inicio: new Date('2026-07-15T10:00:00'), fin: new Date('2026-07-15T11:00:00') }];
    const huecos = calcularHuecos({
      dia: MIERCOLES, duracionMin: 60, horarios: horarioManana,
      reservas, paso: 60, ahora: AHORA_TEMPRANO,
    });
    expect(huecos.map((h) => h.inicio.getHours())).toEqual([9, 11, 12]);
  });

  it('respeta los bloqueos igual que las reservas', () => {
    const bloqueos = [{ inicio: new Date('2026-07-15T09:00:00'), fin: new Date('2026-07-15T11:00:00') }];
    const huecos = calcularHuecos({
      dia: MIERCOLES, duracionMin: 60, horarios: horarioManana,
      bloqueos, paso: 60, ahora: AHORA_TEMPRANO,
    });
    expect(huecos.map((h) => h.inicio.getHours())).toEqual([11, 12]);
  });

  it('no ofrece huecos en días sin horario', () => {
    const domingo = new Date('2026-07-19T12:00:00');
    const huecos = calcularHuecos({
      dia: domingo, duracionMin: 30, horarios: horarioManana, ahora: AHORA_TEMPRANO,
    });
    expect(huecos).toEqual([]);
  });
});