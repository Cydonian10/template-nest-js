import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { UnidadProducto } from '../../../entities/unidad-producto.entity.js';
import { EditarUnidadProductoCommand } from './editar-unidad-producto.command.js';

@CommandHandler(EditarUnidadProductoCommand)
export class EditarUnidadProductoHandler implements ICommandHandler<EditarUnidadProductoCommand> {
  constructor(
    @InjectRepository(UnidadProducto)
    private readonly unidadesProducto: Repository<UnidadProducto>,
  ) {}

  async execute({
    productoId,
    asignacionId,
    factorABase,
  }: EditarUnidadProductoCommand): Promise<UnidadProducto> {
    const asignacion = await this.unidadesProducto.findOne({
      where: { id: asignacionId, producto: { id: productoId } },
      relations: { producto: true, unidad: true },
    });
    if (!asignacion)
      throw new ResourceNotFoundException('Unidad del producto', asignacionId);
    // La unidad no cambia: editar una asociación solo modifica su conversión.
    asignacion.factorABase = factorABase;
    return this.unidadesProducto.save(asignacion);
  }
}
