import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import type { ListaExistenciasResponseDto } from '../../dto/existencia-response.dto.js';
import { Almacen } from '../../../entities/almacen.entity.js';
import { Existencia } from '../../../entities/existencia.entity.js';
import { VarianteProducto } from '../../../entities/variante-producto.entity.js';
import { ListarExistenciasQuery } from './listar-existencias.query.js';

type SaldoFila = {
  varianteId: string;
  almacenId: string;
  almacenNombre: string;
  cantidadBase: string;
  valorCosto: string;
  costoPromedioBase: string | null;
  costoRegistradoCero: boolean;
};

@QueryHandler(ListarExistenciasQuery)
export class ListarExistenciasHandler implements IQueryHandler<ListarExistenciasQuery> {
  constructor(
    @InjectRepository(VarianteProducto)
    private readonly variantes: Repository<VarianteProducto>,
  ) {}

  async execute({
    filter,
  }: ListarExistenciasQuery): Promise<ListaExistenciasResponseDto> {
    // Fila, recuento, total y catálogo deben corresponder al mismo instante,
    // incluso si una compra confirma un ingreso durante esta consulta.
    return this.variantes.manager.transaction(
      'REPEATABLE READ',
      async (manager) => {
        const almacenes = manager.getRepository(Almacen);
        const variantesRepo = manager.getRepository(VarianteProducto);
        const existenciasRepo = manager.getRepository(Existencia);
        if (filter.almacenId !== 'todos') {
          const activo = await almacenes.existsBy({
            id: filter.almacenId,
            activo: true,
          });
          if (!activo) {
            throw new ResourceNotFoundException(
              'Almacén activo',
              filter.almacenId,
            );
          }
        }

        // Partir de variantes × almacenes activos permite incluir saldos cero sin
        // generar todas las combinaciones en memoria; los inactivos solo entran con stock.
        const filas = variantesRepo
          .createQueryBuilder('variante')
          .innerJoin('variante.producto', 'producto')
          .innerJoin(Almacen, 'almacen', 'almacen.activo = true')
          .leftJoin(
            Existencia,
            'existencia',
            'existencia.varianteId = variante.id AND existencia.almacenId = almacen.id',
          )
          .where(
            '((variante.activo = true AND producto.activo = true) OR existencia.cantidad > 0)',
          );

        if (filter.almacenId !== 'todos') {
          filas.andWhere('almacen.id = :almacenId', {
            almacenId: filter.almacenId,
          });
        }
        if (filter.productoId) {
          filas.andWhere('producto.id = :productoId', {
            productoId: filter.productoId,
          });
        }
        if (filter.q) {
          const search = `%${filter.q.replace(/[!%_]/g, '!$&')}%`;
          filas.andWhere(
            "(producto.nombre ILIKE :search ESCAPE '!' OR variante.sku ILIKE :search ESCAPE '!')",
            { search },
          );
        }
        if (filter.disponibilidad === 'con_stock') {
          filas.andWhere('existencia.cantidad > 0');
        } else if (filter.disponibilidad === 'sin_stock') {
          filas.andWhere('COALESCE(existencia.cantidad, 0) = 0');
        }

        const totalQuery = existenciasRepo
          .createQueryBuilder('saldo')
          .innerJoin('saldo.almacen', 'almacen', 'almacen.activo = true')
          .select(
            'COALESCE(SUM(saldo.valorCosto), 0)::text',
            'totalValorCosto',
          );
        if (filter.almacenId !== 'todos') {
          totalQuery.where('almacen.id = :almacenId', {
            almacenId: filter.almacenId,
          });
        }

        // Todas comparten la misma conexión y el mismo snapshot: no ejecutarlas
        // simultáneamente sobre el cliente de PostgreSQL.
        const count = await filas
          .clone()
          .select('COUNT(*)', 'total')
          .getRawOne<{ total: string }>();
        const saldos = await filas
          .select('variante.id', 'varianteId')
          .addSelect('almacen.id', 'almacenId')
          .addSelect('almacen.nombre', 'almacenNombre')
          .addSelect('COALESCE(existencia.cantidad, 0)::text', 'cantidadBase')
          .addSelect('COALESCE(existencia.valorCosto, 0)::text', 'valorCosto')
          .addSelect(
            'CASE WHEN existencia.cantidad > 0 THEN ROUND(existencia.valorCosto / existencia.cantidad, 6)::text ELSE NULL END',
            'costoPromedioBase',
          )
          .addSelect(
            'CASE WHEN existencia.cantidad > 0 AND existencia.valorCosto = 0 THEN true ELSE false END',
            'costoRegistradoCero',
          )
          .orderBy('producto.nombre', 'ASC')
          .addOrderBy('variante.sku', 'ASC')
          .addOrderBy('variante.id', 'ASC')
          .offset((filter.page - 1) * filter.limit)
          .limit(filter.limit)
          .getRawMany<SaldoFila>();
        const total = await totalQuery.getRawOne<{ totalValorCosto: string }>();

        const ids = [...new Set(saldos.map((saldo) => saldo.varianteId))];
        const variantes = ids.length
          ? await variantesRepo.find({
              where: { id: In(ids) },
              relations: {
                producto: {
                  marca: true,
                  unidadBase: true,
                  unidades: { unidad: true },
                },
                valores: { atributo: true },
              },
            })
          : [];
        const porId = new Map(
          variantes.map((variante) => [variante.id, variante]),
        );

        return {
          items: saldos.map((saldo) => {
            const variante = porId.get(saldo.varianteId);
            if (!variante)
              throw new Error(`Variante no encontrada: ${saldo.varianteId}`);
            const producto = variante.producto;
            return {
              producto: {
                id: producto.id,
                nombre: producto.nombre,
                marca: { id: producto.marca.id, nombre: producto.marca.nombre },
                activo: producto.activo,
                unidadBase: {
                  id: producto.unidadBase.id,
                  nombre: producto.unidadBase.nombre,
                  simbolo: producto.unidadBase.simbolo,
                },
              },
              variante: {
                id: variante.id,
                sku: variante.sku,
                activo: variante.activo,
                precioVenta: variante.precio,
                valores: variante.valores
                  .map(({ atributo, valor }) => ({
                    atributoId: atributo.id,
                    atributo: atributo.nombre,
                    valor,
                  }))
                  .sort((a, b) => a.atributo.localeCompare(b.atributo)),
              },
              almacen: { id: saldo.almacenId, nombre: saldo.almacenNombre },
              cantidadBase: saldo.cantidadBase,
              valorCosto: saldo.valorCosto,
              costoPromedioBase: saldo.costoPromedioBase,
              costoRegistradoCero: saldo.costoRegistradoCero,
              unidadesSecundarias: producto.unidades
                .filter(({ unidad }) => unidad.id !== producto.unidadBase.id)
                .map(({ unidad, factorABase }) => ({
                  id: unidad.id,
                  nombre: unidad.nombre,
                  simbolo: unidad.simbolo,
                  factorABase,
                }))
                .sort((a, b) => a.nombre.localeCompare(b.nombre)),
            };
          }),
          page: filter.page,
          limit: filter.limit,
          totalItems: Number(count?.total ?? '0'),
          totalValorCosto: total?.totalValorCosto ?? '0',
        };
      },
    );
  }
}
