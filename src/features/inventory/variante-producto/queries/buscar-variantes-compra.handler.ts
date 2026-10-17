import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { VarianteProducto } from '../../entities/variante-producto.entity.js';
import type { FilterVariantesCompraDto } from '../dto/variante-compra.dto.js';

export class BuscarVariantesCompraQuery {
  constructor(readonly filter: FilterVariantesCompraDto) {}
}

@QueryHandler(BuscarVariantesCompraQuery)
export class BuscarVariantesCompraHandler implements IQueryHandler<BuscarVariantesCompraQuery> {
  constructor(
    @InjectRepository(VarianteProducto)
    private readonly variantes: Repository<VarianteProducto>,
  ) {}

  execute({
    filter,
  }: BuscarVariantesCompraQuery): Promise<[VarianteProducto[], number]> {
    const q = filter.q?.replace(/[\\%_]/g, '\\$&');
    const activo = { activo: true, producto: { activo: true } };
    return this.variantes.findAndCount({
      where: q
        ? [
            { ...activo, sku: ILike(`%${q}%`) },
            { ...activo, producto: { activo: true, nombre: ILike(`%${q}%`) } },
          ]
        : activo,
      relations: {
        producto: { unidadBase: true, unidades: { unidad: true } },
      },
      order: { producto: { nombre: 'ASC' }, sku: 'ASC', id: 'ASC' },
      skip: (filter.page - 1) * filter.limit,
      take: filter.limit,
    });
  }
}
