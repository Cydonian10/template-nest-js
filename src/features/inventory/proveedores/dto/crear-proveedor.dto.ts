import { z } from 'zod';

const campoOpcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((value) => value || null);

export const CrearProveedorSchema = z.strictObject({
  nombre: z.string().trim().min(1).max(200),
  documento: campoOpcional(100),
  contacto: campoOpcional(200),
});

export type CrearProveedorDto = z.infer<typeof CrearProveedorSchema>;
