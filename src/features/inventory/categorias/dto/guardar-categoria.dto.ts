import { z } from 'zod';

export const CrearCategoriaSchema = z.strictObject({
  nombre: z.string().trim().min(1).max(200),
  descripcion: z.string().trim().nullable().optional(),
});
export type CrearCategoriaDto = z.infer<typeof CrearCategoriaSchema>;

export const EditarCategoriaSchema = CrearCategoriaSchema.partial();
export type EditarCategoriaDto = z.infer<typeof EditarCategoriaSchema>;

export const EstadoCategoriaSchema = z.strictObject({ activo: z.boolean() });
export type EstadoCategoriaDto = z.infer<typeof EstadoCategoriaSchema>;
