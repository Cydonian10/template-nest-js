import { z } from 'zod';

export const AgregarAtributoProductoSchema = z.strictObject({
  atributoId: z.uuid(),
});

export type AgregarAtributoProductoDto = z.infer<
  typeof AgregarAtributoProductoSchema
>;
