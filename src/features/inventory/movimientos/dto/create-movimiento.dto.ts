import { z } from 'zod';

const cantidad = z
  .string()
  .regex(/^-?(0|[1-9]\d{0,13})(?:\.\d{1,6})?$/)
  .refine((value) => !/^-?0(?:\.0+)?$/.test(value), {
    message: 'La cantidad debe ser distinta de cero',
  });

const costo = z.string().regex(/^(0|[1-9]\d{0,13})(?:\.\d{1,6})?$/);

export const CreateMovimientoSchema = z
  .strictObject({
    idempotenciaClave: z.uuid(),
    tipo: z.enum(['salida', 'traslado', 'ajuste']),
    almacenOrigenId: z.uuid(),
    almacenDestinoId: z.uuid().optional(),
    motivo: z.string().trim().max(300).optional(),
    detalles: z
      .array(
        z.strictObject({
          varianteId: z.uuid(),
          unidadId: z.uuid(),
          cantidad,
          costoUnitarioBase: costo.optional(),
        }),
      )
      .min(1),
  })
  .superRefine((input, context) => {
    if (input.tipo === 'traslado') {
      if (
        !input.almacenDestinoId ||
        input.almacenDestinoId === input.almacenOrigenId
      ) {
        context.addIssue({
          code: 'custom',
          path: ['almacenDestinoId'],
          message: 'El destino debe ser diferente del origen',
        });
      }
    } else if (input.almacenDestinoId !== undefined) {
      context.addIssue({
        code: 'custom',
        path: ['almacenDestinoId'],
        message: 'Solo los traslados admiten destino',
      });
    }

    if (input.tipo === 'ajuste' && !input.motivo) {
      context.addIssue({
        code: 'custom',
        path: ['motivo'],
        message: 'El motivo del ajuste es obligatorio',
      });
    }

    const variantes = new Set<string>();
    input.detalles.forEach((detalle, indice) => {
      if (variantes.has(detalle.varianteId)) {
        context.addIssue({
          code: 'custom',
          path: ['detalles', indice, 'varianteId'],
          message: 'La variante está repetida',
        });
      }
      variantes.add(detalle.varianteId);

      const positivo = !detalle.cantidad.startsWith('-');
      if (input.tipo !== 'ajuste' && !positivo) {
        context.addIssue({
          code: 'custom',
          path: ['detalles', indice, 'cantidad'],
          message: 'La cantidad debe ser positiva',
        });
      }
      if (
        input.tipo === 'ajuste' &&
        positivo &&
        detalle.costoUnitarioBase === undefined
      ) {
        context.addIssue({
          code: 'custom',
          path: ['detalles', indice, 'costoUnitarioBase'],
          message: 'El costo unitario base es obligatorio',
        });
      } else if (
        (input.tipo !== 'ajuste' || !positivo) &&
        detalle.costoUnitarioBase !== undefined
      ) {
        context.addIssue({
          code: 'custom',
          path: ['detalles', indice, 'costoUnitarioBase'],
          message: 'Esta operación no admite costo enviado por el cliente',
        });
      }
    });
  });

export type CreateMovimientoDto = z.infer<typeof CreateMovimientoSchema>;
