import { z } from 'zod';

export const UpdateCompraSchema = z.strictObject({
  revision: z.number().int().nonnegative(),
  tipoDocumento: z.enum(['factura', 'boleta', 'otro']),
  fecha: z.iso.date(),
  serieDocumento: z.string().trim().min(1).max(100),
  numeroDocumento: z.string().trim().min(1).max(100),
  observaciones: z.string().trim().max(5000),
  precios: z.array(
    z.strictObject({
      renglonId: z.uuid(),
      precioUnitario: z.string().regex(/^(0|[1-9]\d{0,13})(\.\d{1,6})?$/),
    }),
  ),
});

export type UpdateCompraDto = z.infer<typeof UpdateCompraSchema>;
