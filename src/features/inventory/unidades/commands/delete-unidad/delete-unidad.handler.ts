import { ConflictException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QueryFailedError } from 'typeorm';
import { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { DetalleCompra } from '../../../entities/detalle-compra.entity.js';
import { DetalleMovimiento } from '../../../entities/detalle-movimiento.entity.js';
import { Producto } from '../../../entities/producto.entity.js';
import { UnidadProducto } from '../../../entities/unidad-producto.entity.js';
import { Unidad } from '../../../entities/unidad.entity.js';
import { DeleteUnidadCommand } from './delete-unidad.command.js';

const IN_USE_MESSAGE = 'No se puede eliminar una unidad en uso';

@CommandHandler(DeleteUnidadCommand)
export class DeleteUnidadHandler implements ICommandHandler<DeleteUnidadCommand> {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute({ id }: DeleteUnidadCommand): Promise<void> {
    try {
      await this.unitOfWork.execute(async (manager) => {
        const unidad = await manager.findOne(Unidad, {
          where: { id },
          lock: { mode: 'pessimistic_write' },
        });
        if (!unidad) throw new ResourceNotFoundException('Unidad', id);

        if (
          (await manager.exists(Producto, { where: { unidadBase: { id } } })) ||
          (await manager.exists(UnidadProducto, {
            where: { unidad: { id } },
          })) ||
          (await manager.exists(DetalleCompra, {
            where: { unidad: { id } },
          })) ||
          (await manager.exists(DetalleMovimiento, {
            where: { unidad: { id } },
          }))
        ) {
          throw new ConflictException(IN_USE_MESSAGE);
        }

        await manager.remove(unidad);
      });
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23503'
      ) {
        throw new ConflictException(IN_USE_MESSAGE);
      }
      throw error;
    }
  }
}
