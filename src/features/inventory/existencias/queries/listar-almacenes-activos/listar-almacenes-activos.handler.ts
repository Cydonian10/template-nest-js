import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Almacen } from '../../../entities/almacen.entity.js';
import { ListarAlmacenesActivosQuery } from './listar-alamcenes-activos.query.js';

@QueryHandler(ListarAlmacenesActivosQuery)
export class ListarAlmacenesActivosHandler implements IQueryHandler<ListarAlmacenesActivosQuery> {
  constructor(
    @InjectRepository(Almacen) private readonly almacenes: Repository<Almacen>,
  ) {}

  async execute(): Promise<Pick<Almacen, 'id' | 'nombre'>[]> {
    return this.almacenes.find({
      select: { id: true, nombre: true },
      where: { activo: true },
      order: { ordenCreacion: 'ASC' },
    });
  }
}
