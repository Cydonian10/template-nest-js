import { z } from 'zod';

const BooleanoFormularioSchema = z.union([
  z.boolean(),
  z.enum(['true', 'false']).transform((value) => value === 'true'),
]);

export const CrearMarcaSchema = z.strictObject({
  nombre: z.string().trim().min(1).max(200),
  activo: BooleanoFormularioSchema.optional(),
});
export type CrearMarcaDto = z.infer<typeof CrearMarcaSchema>;

export const EditarMarcaSchema = z.strictObject({
  nombre: z.string().trim().min(1).max(200).optional(),
  quitarImagen: BooleanoFormularioSchema.optional(),
});
export type EditarMarcaDto = z.infer<typeof EditarMarcaSchema>;

export const EstadoMarcaSchema = z.strictObject({ activo: z.boolean() });
export type EstadoMarcaDto = z.infer<typeof EstadoMarcaSchema>;
