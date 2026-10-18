import { NotImplementedException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { Almacen } from '../../../entities/almacen.entity.js';
import { ListarExistenciasQuery } from './listar-existencias.query.js';

@QueryHandler(ListarExistenciasQuery)
export class ListarExistenciasHandler implements IQueryHandler<ListarExistenciasQuery> {
  constructor(
    @InjectRepository(Almacen) private readonly almacenes: Repository<Almacen>,
  ) {}

  async execute({ filter }: ListarExistenciasQuery): Promise<never> {
    if (filter.almacenId !== 'todos') {
      const activo = await this.almacenes.existsBy({
        id: filter.almacenId,
        activo: true,
      });
      if (!activo) {
        throw new ResourceNotFoundException('Almacén activo', filter.almacenId);
      }
    }

    // El paso 4 implementará los saldos; no exponer una lista vacía como si fuera real.
    throw new NotImplementedException(
      'La consulta de existencias aún no está disponible',
    );
  }
}
