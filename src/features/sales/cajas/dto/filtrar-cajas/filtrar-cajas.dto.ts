import { z } from 'zod';

export const FiltrarCajasSchema = z.strictObject({
  fechaOperativa: z.iso.date().optional(),
  estado: z.enum(['activas', 'inactivas', 'todas']).default('todas'),
});

export type FiltrarCajasDto = z.infer<typeof FiltrarCajasSchema>;
