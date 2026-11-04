import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { In } from 'typeorm';
import { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { Almacen } from '../../../../inventory/entities/almacen.entity.js';
import { Producto } from '../../../../inventory/entities/producto.entity.js';
import { Unidad } from '../../../../inventory/entities/unidad.entity.js';
import { VarianteProducto } from '../../../../inventory/entities/variante-producto.entity.js';
import {
  CrearVentaSchema,
  IdempotencyKeySchema,
} from '../../dto/crear-venta.dto.js';
import { calcularVenta } from './calcular-venta.js';
import { CrearVentaCommand } from './crear-venta.command.js';

@CommandHandler(CrearVentaCommand)
export class CrearVentaHandler implements ICommandHandler<CrearVentaCommand> {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(
    command: CrearVentaCommand,
  ): Promise<ReturnType<typeof calcularVenta>> {
    const resultado = CrearVentaSchema.safeParse(command.data);
    if (
      !resultado.success ||
      !IdempotencyKeySchema.safeParse(command.idempotenciaClave).success
    ) {
      throw new BadRequestException('Datos de venta no válidos');
    }
    const input = resultado.data;
    return this.unitOfWork.execute(async (manager) => {
      const almacen = await manager.findOneBy(Almacen, { id: input.almacenId });
      if (!almacen) throw new NotFoundException('El almacén no existe');
      if (!almacen.activo)
        throw new BadRequestException('El almacén no está disponible');

      const ids = [
        ...new Set(
          input.detalles.map(({ varianteId }) => varianteId.toLowerCase()),
        ),
      ];
      const referencias = await manager.find(VarianteProducto, {
        where: { id: In(ids) },
        relations: { producto: true },
      });
      if (referencias.length !== ids.length)
        throw new NotFoundException('La variante no existe');
      const productos = [
        ...new Set(referencias.map(({ producto }) => producto.id)),
      ].sort();
      for (const id of productos) {
        const producto = await manager.findOne(Producto, {
          where: { id },
          lock: { mode: 'pessimistic_read' },
        });
        if (!producto) throw new NotFoundException('El producto no existe');
      }
      const variantes = await manager.find(VarianteProducto, {
        where: { id: In(ids) },
        relations: {
          producto: { unidadBase: true, unidades: { unidad: true } },
        },
      });
      const porId = new Map(
        variantes.map((variante) => [variante.id.toLowerCase(), variante]),
      );
      const unidadIds = [
        ...new Set(
          input.detalles.map(({ unidadId }) => unidadId.toLowerCase()),
        ),
      ];
      const unidades = await manager.find(Unidad, {
        where: { id: In(unidadIds) },
      });
      if (unidades.length !== unidadIds.length)
        throw new NotFoundException('La unidad no existe');
      const lineas = input.detalles.map((detalle) => {
        const variante = porId.get(detalle.varianteId.toLowerCase());
        if (!variante) throw new NotFoundException('La variante no existe');
        if (!variante.activo || !variante.producto.activo) {
          throw new BadRequestException('La variante no está disponible');
        }
        const unidadId = detalle.unidadId.toLowerCase();
        const esBase =
          variante.producto.unidadBase.id.toLowerCase() === unidadId;
        const secundaria = variante.producto.unidades.find(
          ({ unidad }) => unidad.id.toLowerCase() === unidadId,
        );
        const factorABase = esBase ? '1' : secundaria?.factorABase;
        if (!factorABase)
          throw new BadRequestException('La unidad no pertenece al producto');
        return { ...detalle, factorABase, precioBase: variante.precio };
      });
      return calcularVenta(lineas, input.pagos);
    });
  }
}
