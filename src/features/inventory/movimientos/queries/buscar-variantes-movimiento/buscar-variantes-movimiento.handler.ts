import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { Almacen } from '../../../entities/almacen.entity.js';
import { VarianteProducto } from '../../../entities/variante-producto.entity.js';
import { BuscarVariantesMovimientoQuery } from './buscar-variantes-movimiento.query.js';

@QueryHandler(BuscarVariantesMovimientoQuery)
export class BuscarVariantesMovimientoHandler implements IQueryHandler<BuscarVariantesMovimientoQuery> {
  constructor(
    @InjectRepository(Almacen) private readonly almacenes: Repository<Almacen>,
    @InjectRepository(VarianteProducto)
    private readonly variantes: Repository<VarianteProducto>,
  ) {}

  async execute({
    filter,
  }: BuscarVariantesMovimientoQuery): Promise<[VarianteProducto[], number]> {
    const activo = await this.almacenes.existsBy({
      id: filter.almacenId,
      activo: true,
    });
    if (!activo) {
      throw new ResourceNotFoundException('Almacén activo', filter.almacenId);
    }

    const search = `%${filter.q.replace(/[!%_]/g, '!$&')}%`;
    const query = this.variantes
      .createQueryBuilder('variante')
      .innerJoinAndSelect('variante.producto', 'producto')
      .innerJoinAndSelect('producto.unidadBase', 'base')
      .leftJoinAndSelect('producto.unidades', 'productoUnidad')
      .leftJoinAndSelect('productoUnidad.unidad', 'unidad')
      .leftJoinAndSelect(
        'variante.existencias',
        'existencia',
        'existencia.almacenId = :almacenId',
        { almacenId: filter.almacenId },
      )
      .where(
        "(producto.nombre ILIKE :search ESCAPE '!' OR variante.sku ILIKE :search ESCAPE '!')",
        { search },
      );

    if (filter.tipo === 'traslado') {
      query.andWhere(
        'producto.activo = true AND variante.activo = true AND existencia.cantidad > 0',
      );
    } else if (filter.tipo === 'salida') {
      query.andWhere('existencia.cantidad > 0');
    } else {
      query.andWhere(
        '((producto.activo = true AND variante.activo = true) OR existencia.cantidad > 0)',
      );
    }

    return query
      .orderBy('producto.nombre', 'ASC')
      .addOrderBy('variante.sku', 'ASC')
      .addOrderBy('variante.id', 'ASC')
      .skip((filter.page - 1) * filter.limit)
      .take(filter.limit)
      .getManyAndCount();
  }
}
