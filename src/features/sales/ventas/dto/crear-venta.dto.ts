import { z } from 'zod';
import { MedioPago } from '../../entities/pago-venta.entity.js';

const cantidad = z
  .string()
  .regex(/^\d{1,14}(\.\d{1,6})?$/)
  .refine(
    (valor) => /[1-9]/.test(valor),
    'La cantidad debe ser mayor que cero',
  );

const importe = z
  .string()
  .regex(/^\d{1,16}(\.\d{1,2})?$/)
  .refine((valor) => /[1-9]/.test(valor), 'El importe debe ser mayor que cero');

export const IdempotencyKeySchema = z
  .string()
  .refine(
    (valor) => valor.trim().length > 0,
    'La clave de idempotencia es obligatoria',
  );

export const CrearVentaSchema = z
  .strictObject({
    turnoId: z.uuid(),
    almacenId: z.uuid(),
    detalles: z
      .array(
        z.strictObject({
          varianteId: z.uuid(),
          unidadId: z.uuid(),
          cantidad,
        }),
      )
      .min(1),
    pagos: z
      .array(
        z.strictObject({
          medio: z.enum(MedioPago),
          importe,
        }),
      )
      .min(1),
  })
  .superRefine((solicitud, contexto) => {
    const pares = new Set<string>();
    solicitud.detalles.forEach((detalle, indice) => {
      const par = `${detalle.varianteId.toLowerCase()}:${detalle.unidadId.toLowerCase()}`;
      if (pares.has(par)) {
        contexto.addIssue({
          code: 'custom',
          path: ['detalles', indice],
          message: 'La variante y unidad están repetidas',
        });
      }
      pares.add(par);
    });
  });

export type CrearVentaDto = z.infer<typeof CrearVentaSchema>;
