import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proveedor } from '../../../entities/proveedor.entity.js';
import { createProveedoresWhere } from '../proveedores-query.utils.js';
import { FindProveedoresQuery } from './find-proveedores.query.js';

@QueryHandler(FindProveedoresQuery)
export class FindProveedoresHandler implements IQueryHandler<FindProveedoresQuery> {
  constructor(
    @InjectRepository(Proveedor)
    private readonly proveedores: Repository<Proveedor>,
  ) {}

  execute({ filter }: FindProveedoresQuery): Promise<[Proveedor[], number]> {
    return this.proveedores.findAndCount({
      where: createProveedoresWhere(filter),
      order: { nombre: 'ASC', id: 'ASC' },
      skip: (filter.page - 1) * filter.limit,
      take: filter.limit,
    });
  }
}
