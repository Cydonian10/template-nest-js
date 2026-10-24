import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { Producto } from '../../../entities/producto.entity.js';
import { FindProductByIdQuery } from './find-product-by-id.query.js';

@QueryHandler(FindProductByIdQuery)
export class FindProductByIdHandler implements IQueryHandler<FindProductByIdQuery> {
  constructor(
    @InjectRepository(Producto)
    private readonly productos: Repository<Producto>,
  ) {}

  async execute({ id }: FindProductByIdQuery): Promise<Producto> {
    const producto = await this.productos.findOne({
      where: { id },
      relations: {
        unidadBase: true,
        marca: { imagen: true },
        categorias: true,
        imagenes: { imagen: true },
      },
      order: { imagenes: { orden: 'ASC' } },
    });
    if (!producto) throw new ResourceNotFoundException('Producto', id);
    return producto;
  }
}
