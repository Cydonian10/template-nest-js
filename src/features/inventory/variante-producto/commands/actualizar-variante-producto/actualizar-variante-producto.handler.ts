import { ConflictException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QueryFailedError } from 'typeorm';
import { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { VarianteProducto } from '../../../entities/variante-producto.entity.js';
import { ActualizarVarianteProducto } from './actualizar-variante-producto.command.js';

@CommandHandler(ActualizarVarianteProducto)
export class ActualizarVarianteProductoHandler implements ICommandHandler<ActualizarVarianteProducto> {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute({
    productoId,
    varianteId,
    data,
  }: ActualizarVarianteProducto): Promise<VarianteProducto> {
    try {
      return await this.unitOfWork.execute(async (manager) => {
        const variante = await manager.findOne(VarianteProducto, {
          where: { id: varianteId },
          lock: { mode: 'pessimistic_write' },
        });
        if (
          !variante ||
          !(await manager.exists(VarianteProducto, {
            where: { id: varianteId, producto: { id: productoId } },
          }))
        )
          throw new ResourceNotFoundException('Variante', varianteId);

        if (data.precio !== undefined) variante.precio = data.precio;
        if (data.codigoBarras !== undefined)
          variante.codigoBarras = data.codigoBarras;
        if (data.activo !== undefined) variante.activo = data.activo;
        await manager.save(VarianteProducto, variante);

        return manager.findOneOrFail(VarianteProducto, {
          where: { id: varianteId, producto: { id: productoId } },
          relations: {
            producto: true,
            valores: true,
            imagenes: { imagen: true },
          },
          order: { imagenes: { orden: 'ASC' } },
        });
      });
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23505'
      ) {
        throw new ConflictException('Código de barras ya registrado');
      }
      throw error;
    }
  }
}
