import { BadRequestException, ConflictException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { Producto } from '../../../entities/producto.entity.js';
import { UnidadProducto } from '../../../entities/unidad-producto.entity.js';
import { Unidad } from '../../../entities/unidad.entity.js';
import { AgregarUnidadProductoCommand } from './agregar-unidad-producto.command.js';

@CommandHandler(AgregarUnidadProductoCommand)
export class AgregarUnidadProductoHandler implements ICommandHandler<AgregarUnidadProductoCommand> {
  constructor(
    @InjectRepository(Producto)
    private readonly productos: Repository<Producto>,
    @InjectRepository(Unidad)
    private readonly unidades: Repository<Unidad>,
    @InjectRepository(UnidadProducto)
    private readonly unidadesProducto: Repository<UnidadProducto>,
  ) {}

  async execute({
    data: { productoId, unidadId, factorABase },
  }: AgregarUnidadProductoCommand): Promise<UnidadProducto> {
    const producto = await this.productos.findOne({
      where: { id: productoId },
      relations: { unidadBase: true },
    });
    if (!producto) {
      throw new ResourceNotFoundException('Producto', productoId);
    }
    // La unidad base siempre tiene factor 1 y no se registra como secundaria.
    if (producto.unidadBase.id === unidadId) {
      throw new BadRequestException(
        'La unidad base no puede agregarse como secundaria',
      );
    }
    if (!(await this.unidades.existsBy({ id: unidadId }))) {
      throw new ResourceNotFoundException('Unidad', unidadId);
    }
    if (
      await this.unidadesProducto.existsBy({
        producto: { id: productoId },
        unidad: { id: unidadId },
      })
    ) {
      throw new ConflictException('La unidad ya está asociada al producto');
    }

    try {
      const asignacion = this.unidadesProducto.create({
        producto: { id: productoId },
        unidad: { id: unidadId },
        factorABase,
      });
      return await this.unidadesProducto.save(asignacion);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const code = (error.driverError as { code?: string }).code;
        if (code === '23505') {
          throw new ConflictException('La unidad ya está asociada al producto');
        }
        if (code === '23503') {
          throw new ConflictException('El producto o la unidad ya no existe');
        }
      }
      throw error;
    }
  }
}
