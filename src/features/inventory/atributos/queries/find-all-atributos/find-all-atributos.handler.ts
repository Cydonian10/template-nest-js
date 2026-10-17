import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Atributo } from '../../../entities/atributo.entity.js';
import { AtributoProducto } from '../../../entities/atributo-producto.entity.js';
import { FindAllAtributosQuery } from './find-all-atributos.query.js';

export interface AtributosListado {
  atributos: { id: string; nombre: string; usoProductos: number }[];
  total: number;
  totalRegistrados: number;
  totalEnUso: number;
}

@QueryHandler(FindAllAtributosQuery)
export class FindAllAtributosHandler implements IQueryHandler<FindAllAtributosQuery> {
  constructor(
    @InjectRepository(Atributo)
    private readonly atributos: Repository<Atributo>,
    @InjectRepository(AtributoProducto)
    private readonly atributosProducto: Repository<AtributoProducto>,
  ) {}

  async execute({ filter }: FindAllAtributosQuery): Promise<AtributosListado> {
    const { nombre, page, limit } = filter;
    const escapedName = nombre?.replace(/[\\%_]/g, '\\$&');

    const [[atributos, total], totalRegistrados, enUso] = await Promise.all([
      this.atributos.findAndCount({
        where:
          escapedName === undefined
            ? {}
            : { nombre: ILike(`%${escapedName}%`) },
        order: { nombre: 'ASC', id: 'ASC' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.atributos.count(),
      this.atributosProducto
        .createQueryBuilder('asignacion')
        .select('COUNT(DISTINCT asignacion.atributoId)', 'total')
        .getRawOne<{ total: string }>(),
    ]);

    const usage = atributos.length
      ? await this.atributosProducto
          .createQueryBuilder('asignacion')
          .select('asignacion.atributoId', 'id')
          .addSelect('COUNT(*)', 'total')
          .where('asignacion.atributoId IN (:...ids)', {
            ids: atributos.map(({ id }) => id),
          })
          .groupBy('asignacion.atributoId')
          .getRawMany<{ id: string; total: string }>()
      : [];
    const counts = new Map(usage.map(({ id, total }) => [id, Number(total)]));

    return {
      atributos: atributos.map(({ id, nombre }) => ({
        id,
        nombre,
        usoProductos: counts.get(id) ?? 0,
      })),
      total,
      totalRegistrados,
      totalEnUso: Number(enUso?.total ?? 0),
    };
  }
}
