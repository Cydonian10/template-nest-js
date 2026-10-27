import { z } from 'zod';

export const PeriodoActividadSchema = z.object({
  desde: z.iso.date(),
  hasta: z.iso.date(),
}).refine(({ desde, hasta }) => desde <= hasta, {
  message: 'La fecha desde no puede ser posterior a hasta',
  path: ['hasta'],
});

export type PeriodoActividad = z.infer<typeof PeriodoActividadSchema>;

export type ConteoDiario = { fecha: string; cantidad: number };

// Fechas de calendario: UTC se usa solo para iterar sin saltos por horario de
// verano. El agrupamiento de instantes se hace en SQL en America/Lima.
export function completarDias(
  { desde, hasta }: PeriodoActividad,
  filas: { fecha: string; cantidad: string }[],
): ConteoDiario[] {
  const cantidades = new Map(filas.map(({ fecha, cantidad }) => [fecha, Number(cantidad)]));
  const dias: ConteoDiario[] = [];
  const fin = Date.parse(`${hasta}T00:00:00Z`);
  for (let dia = Date.parse(`${desde}T00:00:00Z`); dia <= fin; dia += 86_400_000) {
    const fecha = new Date(dia).toISOString().slice(0, 10);
    dias.push({ fecha, cantidad: cantidades.get(fecha) ?? 0 });
  }
  return dias;
}
