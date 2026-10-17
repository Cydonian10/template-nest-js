import { z } from 'zod';

// Las columnas numeric(20,6) admiten hasta 14 dígitos enteros.
const decimal = z.string().regex(/^(0|[1-9]\d{0,13})(\.\d{1,6})?$/);
const positivo = decimal.refine((value) => !/^0(?:\.0+)?$/.test(value), {
  message: 'La cantidad debe ser mayor que cero',
});

export const CreateCompraSchema = z.strictObject({
  proveedorId: z.uuid(),
  almacenId: z.uuid(),
  tipoDocumento: z.enum(['factura', 'boleta', 'otro']),
  fecha: z.iso.date(),
  serieDocumento: z.string().trim().min(1).max(100),
  numeroDocumento: z.string().trim().min(1).max(100),
  observaciones: z.string().trim().optional(),
  renglones: z
    .array(
      z.strictObject({
        varianteId: z.uuid(),
        unidadId: z.uuid(),
        cantidad: positivo,
        precioUnitario: decimal,
      }),
    )
    .min(1),
});

export type CreateCompraDto = z.infer<typeof CreateCompraSchema>;
