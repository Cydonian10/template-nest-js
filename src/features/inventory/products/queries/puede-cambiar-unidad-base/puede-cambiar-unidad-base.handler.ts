import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { puedeCambiarUnidadBase } from '../puede-cambiar-unidad-base.js';
import { PuedeCambiarUnidadBaseQuery } from './puede-cambiar-unidad-base.query.js';

@QueryHandler(PuedeCambiarUnidadBaseQuery)
export class PuedeCambiarUnidadBaseHandler implements IQueryHandler<PuedeCambiarUnidadBaseQuery> {
  constructor(@InjectEntityManager() private readonly manager: EntityManager) {}

  execute({ productoId }: PuedeCambiarUnidadBaseQuery): Promise<boolean> {
    return puedeCambiarUnidadBase(this.manager, productoId);
  }
}
