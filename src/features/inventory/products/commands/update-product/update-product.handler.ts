import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { Producto } from '../../../entities/producto.entity.js';
import { Unidad } from '../../../entities/unidad.entity.js';
import { UpdateProductCommand } from './update-product.command.js';

@CommandHandler(UpdateProductCommand)
export class UpdateProductHandler implements ICommandHandler<UpdateProductCommand> {
  constructor(
    @InjectRepository(Producto)
    private readonly productos: Repository<Producto>,
    @InjectRepository(Unidad)
    private readonly unidades: Repository<Unidad>,
  ) {}

  async execute({ id, data }: UpdateProductCommand): Promise<Producto> {
    const producto = await this.productos.findOne({
      where: { id },
      relations: { unidadBase: true, imagenes: { imagen: true } },
      order: { imagenes: { orden: 'ASC' } },
    });
    if (!producto) throw new ResourceNotFoundException('Producto', id);

    if (
      data.unidadBaseId !== undefined &&
      data.unidadBaseId !== producto.unidadBase.id
    ) {
      const unidad = await this.unidades.findOneBy({ id: data.unidadBaseId });
      if (!unidad)
        throw new ResourceNotFoundException('Unidad', data.unidadBaseId);
      producto.unidadBase = unidad;
    }
    if (data.nombre !== undefined) producto.nombre = data.nombre;
    if (data.descripcion !== undefined) producto.descripcion = data.descripcion;
    if (data.activo !== undefined) producto.activo = data.activo;

    return this.productos.save(producto);
  }
}
