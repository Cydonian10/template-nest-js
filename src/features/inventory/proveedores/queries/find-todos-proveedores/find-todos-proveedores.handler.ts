import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proveedor } from '../../../entities/proveedor.entity.js';
import { createProveedoresWhere } from '../proveedores-query.utils.js';
import { FindTodosProveedoresQuery } from './find-todos-proveedores.query.js';

@QueryHandler(FindTodosProveedoresQuery)
export class FindTodosProveedoresHandler implements IQueryHandler<FindTodosProveedoresQuery> {
  constructor(
    @InjectRepository(Proveedor)
    private readonly proveedores: Repository<Proveedor>,
  ) {}

  execute({ filter }: FindTodosProveedoresQuery): Promise<Proveedor[]> {
    return this.proveedores.find({
      where: createProveedoresWhere(filter),
      order: { nombre: 'ASC', id: 'ASC' },
    });
  }
}
