import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Almacen } from '../entities/almacen.entity.js';
import type { FilterAlmacenDto } from './almacenes.dto.js';

export class FindAllAlmacenesQuery {
  constructor(readonly filter: FilterAlmacenDto) {}
}

@QueryHandler(FindAllAlmacenesQuery)
export class FindAllAlmacenesHandler implements IQueryHandler<FindAllAlmacenesQuery> {
  constructor(
    @InjectRepository(Almacen) private readonly almacenes: Repository<Almacen>,
  ) {}

  async execute({ filter }: FindAllAlmacenesQuery) {
    const escapedName = filter.nombre?.replace(/[\\%_]/g, '\\$&');
    const where = {
      ...(escapedName !== undefined
        ? { nombre: ILike(`%${escapedName}%`) }
        : {}),
      ...(filter.activo !== undefined ? { activo: filter.activo } : {}),
    };
    const [[data, total], totalActivos, totalInactivos] = await Promise.all([
      this.almacenes.findAndCount({
        where,
        order: { nombre: 'ASC', id: 'ASC' },
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
      }),
      this.almacenes.countBy({ activo: true }),
      this.almacenes.countBy({ activo: false }),
    ]);
    return {
      data,
      total,
      totalRegistrados: totalActivos + totalInactivos,
      totalActivos,
      totalInactivos,
    };
  }
}
