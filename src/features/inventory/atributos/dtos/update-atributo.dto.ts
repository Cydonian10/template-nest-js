import type { z } from 'zod';
import { CreateAtributoSchema } from './create-atributo.dto.js';

// Nombre es el único campo editable; una actualización vacía no tiene sentido.
export const UpdateAtributoSchema = CreateAtributoSchema;
export type UpdateAtributoDto = z.infer<typeof UpdateAtributoSchema>;
