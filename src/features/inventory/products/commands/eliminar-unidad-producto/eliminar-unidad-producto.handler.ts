import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { UnidadProducto } from '../../../entities/unidad-producto.entity.js';
import { EliminarUnidadProductoCommand } from './eliminar-unidad-producto.command.js';

@CommandHandler(EliminarUnidadProductoCommand)
export class EliminarUnidadProductoHandler implements ICommandHandler<EliminarUnidadProductoCommand> {
  constructor(
    @InjectRepository(UnidadProducto)
    private readonly unidadesProducto: Repository<UnidadProducto>,
  ) {}

  async execute({
    productoId,
    asignacionId,
  }: EliminarUnidadProductoCommand): Promise<void> {
    const asignacion = await this.unidadesProducto.findOne({
      where: { id: asignacionId, producto: { id: productoId } },
    });
    if (!asignacion)
      throw new ResourceNotFoundException('Unidad del producto', asignacionId);
    await this.unidadesProducto.remove(asignacion);
  }
}
