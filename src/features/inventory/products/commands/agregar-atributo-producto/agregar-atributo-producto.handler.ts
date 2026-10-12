import { ConflictException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { AtributoProducto } from '../../../entities/atributo-producto.entity.js';
import { Atributo } from '../../../entities/atributo.entity.js';
import { Producto } from '../../../entities/producto.entity.js';
import { AgregarAtributoProductoCommand } from './agregar-atributo-producto.command.js';

@CommandHandler(AgregarAtributoProductoCommand)
export class AgregarAtributoProductoHandler implements ICommandHandler<AgregarAtributoProductoCommand> {
  constructor(
    @InjectRepository(Producto)
    private readonly productos: Repository<Producto>,
    @InjectRepository(Atributo)
    private readonly atributos: Repository<Atributo>,
    @InjectRepository(AtributoProducto)
    private readonly atributosProducto: Repository<AtributoProducto>,
  ) {}

  async execute({
    data: { productoId, atributoId },
  }: AgregarAtributoProductoCommand): Promise<AtributoProducto> {
    if (!(await this.productos.existsBy({ id: productoId }))) {
      throw new ResourceNotFoundException('Producto', productoId);
    }
    if (!(await this.atributos.existsBy({ id: atributoId }))) {
      throw new ResourceNotFoundException('Atributo', atributoId);
    }
    if (await this.atributosProducto.existsBy({ productoId, atributoId })) {
      throw new ConflictException('El atributo ya está asociado al producto');
    }

    try {
      const asignacion = this.atributosProducto.create({
        productoId,
        atributoId,
      });
      await this.atributosProducto.insert(asignacion);
      return asignacion;
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const code = (error.driverError as { code?: string }).code;
        if (code === '23505') {
          throw new ConflictException(
            'El atributo ya está asociado al producto',
          );
        }
        if (code === '23503') {
          throw new ConflictException('El producto o atributo ya no existe');
        }
      }
      throw error;
    }
  }
}
