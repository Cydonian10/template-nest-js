import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { Almacen } from '../../../entities/almacen.entity.js';
import { Existencia } from '../../../entities/existencia.entity.js';
import { MinimoExistencia } from '../../../entities/minimo-existencia.entity.js';
import { VarianteProducto } from '../../../entities/variante-producto.entity.js';
import type { AlertaReposicionDto, ResumenReposicionDto } from '../../dto/resumen-reposicion.dto.js';
import { ResumenReposicionQuery } from './resumen-reposicion.query.js';

type Conteos = { bajoMinimo: string; agotadas: string };

@QueryHandler(ResumenReposicionQuery)
export class ResumenReposicionHandler implements IQueryHandler<ResumenReposicionQuery> {
  constructor(
    @InjectRepository(VarianteProducto)
    private readonly variantes: Repository<VarianteProducto>,
  ) {}

  async execute({ almacenId }: ResumenReposicionQuery): Promise<ResumenReposicionDto> {
    return this.variantes.manager.transaction('REPEATABLE READ', async (manager) => {
      if (almacenId !== 'todos') {
        const existe = await manager.getRepository(Almacen).existsBy({
          id: almacenId,
          activo: true,
        });
        if (!existe) throw new ResourceNotFoundException('Almacén activo', almacenId);
      }

      // Una fila por par variante–almacén activo, incluso sin saldo ni mínimo.
      const pares = manager.getRepository(VarianteProducto)
        .createQueryBuilder('variante')
        .innerJoin('variante.producto', 'producto', 'producto.activo = true')
        .innerJoin('producto.unidadBase', 'unidad')
        .innerJoin(Almacen, 'almacen', 'almacen.activo = true')
        .leftJoin(Existencia, 'saldo', 'saldo.varianteId = variante.id AND saldo.almacenId = almacen.id')
        .leftJoin(MinimoExistencia, 'minimo', 'minimo.varianteId = variante.id AND minimo.almacenId = almacen.id')
        .where('variante.activo = true');
      if (almacenId !== 'todos') {
        pares.andWhere('almacen.id = :almacenId', { almacenId });
      }
      const cantidad = 'COALESCE(saldo.cantidad, 0)';
      const minimoBase = 'minimo."minimo_base"';
      const bajo = `(${cantidad} > 0 AND ${cantidad} <= ${minimoBase})`;
      const conteos = await pares.clone()
        .select(`COUNT(*) FILTER (WHERE ${bajo})`, 'bajoMinimo')
        .addSelect(`COUNT(*) FILTER (WHERE ${cantidad} = 0)`, 'agotadas')
        .getRawOne<Conteos>();

      // Orden y límite en PostgreSQL; no se materializa el producto cartesiano en Node.
      const alertas = await pares
        .andWhere(`(${cantidad} = 0 OR ${bajo})`)
        .select('variante.id', 'varianteId')
        .addSelect('producto.nombre', 'productoNombre')
        .addSelect('variante.sku', 'sku')
        .addSelect('almacen.id', 'almacenId')
        .addSelect('almacen.nombre', 'almacenNombre')
        .addSelect('unidad.simbolo', 'unidadBaseSimbolo')
        .addSelect(`${cantidad}::text`, 'cantidadBase')
        .addSelect(`${minimoBase}::text`, 'minimoBase')
        .addSelect(`CASE WHEN ${cantidad} = 0 THEN 'agotada' ELSE 'bajo_minimo' END`, 'tipo')
        .orderBy(`CASE WHEN ${cantidad} = 0 THEN 0 ELSE 1 END`, 'ASC')
        .addOrderBy(`${cantidad} / NULLIF(${minimoBase}, 0)`, 'ASC', 'NULLS FIRST')
        .addOrderBy('variante.sku', 'ASC')
        .addOrderBy('almacen.id', 'ASC')
        .addOrderBy('variante.id', 'ASC')
        .limit(10)
        .getRawMany<AlertaReposicionDto>();
      return {
        bajoMinimo: Number(conteos?.bajoMinimo ?? '0'),
        agotadas: Number(conteos?.agotadas ?? '0'),
        alertas,
      };
    });
  }
}
