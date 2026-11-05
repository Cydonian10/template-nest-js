import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import type {
  CatalogoPagina,
  VarianteCatalogo,
} from '../../dto/listar-catalogo.dto.js';
import { ListarCatalogoQuery } from './listar-catalogo.query.js';

@QueryHandler(ListarCatalogoQuery)
export class ListarCatalogoHandler implements IQueryHandler<ListarCatalogoQuery> {
  constructor(private readonly dataSource: DataSource) {}

  async execute({ filtros }: ListarCatalogoQuery): Promise<CatalogoPagina> {
    return this.dataSource.transaction('REPEATABLE READ', async (manager) => {
      const almacenes: { id: string }[] = await manager.query(
        'SELECT id FROM almacenes WHERE id = $1 AND activo = true',
        [filtros.almacenId],
      );
      if (!almacenes.length)
        throw new ResourceNotFoundException(
          'Almacén activo',
          filtros.almacenId,
        );

      const busqueda = `%${filtros.q.replace(/[!%_]/g, '!$&')}%`;
      const condiciones = `p.activo = true AND (
          p.nombre ILIKE $1 ESCAPE '!' OR v.sku ILIKE $1 ESCAPE '!'
          OR v.codigo_barras ILIKE $1 ESCAPE '!'
          OR EXISTS (SELECT 1 FROM valores_variante filtro
            WHERE filtro.variante_id = v.id AND filtro.valor ILIKE $1 ESCAPE '!')
        )`;
      const [{ total }]: { total: string }[] = await manager.query(
        `SELECT COUNT(*)::text AS total FROM productos p
          JOIN variantes_producto v ON v.producto_id = p.id AND v.activo = true
          WHERE ${condiciones}`,
        [busqueda],
      );
      const items: VarianteCatalogo[] = await manager.query(
        `SELECT v.id, p.id AS "productoId", p.nombre, m.nombre AS marca, v.sku, v.precio::text AS precio,
            COALESCE(e.cantidad, 0)::text AS stock,
            json_build_object('id', ub.id, 'nombre', ub.nombre, 'simbolo', ub.simbolo) AS "unidadBase",
            (jsonb_build_array(jsonb_build_object('id', ub.id, 'nombre', ub.nombre,
              'simbolo', ub.simbolo, 'factorABase', '1')) ||
              COALESCE((SELECT jsonb_agg(jsonb_build_object('id', u.id, 'nombre', u.nombre,
                'simbolo', u.simbolo, 'factorABase', up.factor_a_base::text) ORDER BY u.nombre, u.id)
                FROM unidades_producto up JOIN unidades u ON u.id = up.unidad_id
                WHERE up.producto_id = p.id AND u.id <> ub.id), '[]'::jsonb)) AS unidades,
            COALESCE((SELECT json_agg(json_build_object('nombre', a.nombre, 'valor', vv.valor)
              ORDER BY a.nombre, a.id)
              FROM valores_variante vv JOIN atributos a ON a.id = vv.atributo_id
              WHERE vv.variante_id = v.id), '[]'::json) AS atributos
           FROM productos p
           JOIN marcas m ON m.id = p.marca_id
           JOIN unidades ub ON ub.id = p.unidad_base_id
           JOIN variantes_producto v ON v.producto_id = p.id AND v.activo = true
           LEFT JOIN existencias e ON e.variante_id = v.id AND e.almacen_id = $2
           WHERE ${condiciones}
           ORDER BY p.nombre ASC, p.id ASC, v.sku ASC, v.id ASC
           LIMIT $3 OFFSET $4`,
        [
          busqueda,
          filtros.almacenId,
          filtros.limit,
          (filtros.page - 1) * filtros.limit,
        ],
      );
      return {
        items,
        page: filtros.page,
        limit: filtros.limit,
        totalItems: Number(total),
      };
    });
  }
}
