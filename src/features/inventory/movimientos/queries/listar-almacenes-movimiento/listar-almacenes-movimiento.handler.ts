import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Almacen } from '../../../entities/almacen.entity.js';
import { ListarAlmacenesMovimientoQuery } from './listar-almacenes-movimiento.query.js';

@QueryHandler(ListarAlmacenesMovimientoQuery)
export class ListarAlmacenesMovimientoHandler implements IQueryHandler<ListarAlmacenesMovimientoQuery> {
  constructor(
    @InjectRepository(Almacen) private readonly almacenes: Repository<Almacen>,
  ) {}

  execute(): Promise<Pick<Almacen, 'id' | 'nombre'>[]> {
    return this.almacenes.find({
      select: { id: true, nombre: true },
      where: { activo: true },
      order: { ordenCreacion: 'ASC' },
    });
  }
}
