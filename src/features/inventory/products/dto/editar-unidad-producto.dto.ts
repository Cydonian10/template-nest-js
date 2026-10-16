import { z } from 'zod';
import { AgregarUnidadProductoSchema } from './agregar-unidad-producto.dto.js';

// Reutiliza exactamente la precisión y la regla de positividad de la creación.
export const EditarUnidadProductoSchema = z.strictObject({
  factorABase: AgregarUnidadProductoSchema.shape.factorABase,
});

export type EditarUnidadProductoDto = z.infer<
  typeof EditarUnidadProductoSchema
>;
