import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Producto } from '../../../entities/producto.entity.js';
import { BuscarProductosQuery } from './buscar-productos.query.js';

@QueryHandler(BuscarProductosQuery)
export class BuscarProductosHandler implements IQueryHandler<BuscarProductosQuery> {
  constructor(
    @InjectRepository(Producto)
    private readonly productos: Repository<Producto>,
  ) {}

  execute({ filter }: BuscarProductosQuery): Promise<[Producto[], number]> {
    const escapedName = filter.q.replace(/[\\%_]/g, '\\$&');
    return this.productos.findAndCount({
      where: { nombre: ILike(`%${escapedName}%`) },
      order: { nombre: 'ASC', id: 'ASC' },
      skip: (filter.page - 1) * filter.limit,
      take: filter.limit,
    });
  }
}
