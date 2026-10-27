import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Compra } from '../../../entities/compra.entity.js';
import { completarDias } from '../../../resumen-actividad.js';
import type { ResumenInventarioDto, CompraRecienteDto } from '../../dto/resumen-inventario.dto.js';
import { ResumenInventarioQuery } from './resumen-inventario.query.js';

@QueryHandler(ResumenInventarioQuery)
export class ResumenInventarioHandler implements IQueryHandler<ResumenInventarioQuery> {
  constructor(@InjectRepository(Compra) private readonly compras: Repository<Compra>) {}

  async execute({ periodo }: ResumenInventarioQuery): Promise<ResumenInventarioDto> {
    return this.compras.manager.transaction('REPEATABLE READ', async (manager) => {
      const { desde, hasta } = periodo;
      const porDia = await manager.query<{ fecha: string; cantidad: string }[]>(
        `SELECT c."fecha"::text AS "fecha", count(*)::text AS "cantidad"
         FROM "compras" c WHERE c."fecha" BETWEEN $1::date AND $2::date
         GROUP BY c."fecha" ORDER BY c."fecha"`,
        [desde, hasta],
      );
      const recientes = await manager.query<CompraRecienteDto[]>(
        `SELECT c."id", c."fecha"::text AS "fecha", p."nombre" AS "proveedorNombre",
                c."tipo_documento" AS "tipoDocumento", c."serie_documento" AS "serieDocumento",
                c."numero_documento" AS "numeroDocumento", c."total_documento"::text AS "totalDocumento",
                EXISTS (SELECT 1 FROM "movimientos_inventario" m
                        WHERE m."compra_id" = c."id" AND m."tipo" = 'ingreso'
                          AND m."estado" = 'confirmado') AS "recibida"
         FROM "compras" c JOIN "proveedores" p ON p."id" = c."proveedor_id"
         WHERE c."fecha" BETWEEN $1::date AND $2::date
         ORDER BY c."fecha" DESC, c."id" DESC LIMIT 5`,
        [desde, hasta],
      );
      const dias = completarDias(periodo, porDia);
      return {
        total: dias.reduce((total, dia) => total + dia.cantidad, 0),
        porDia: dias,
        recientes,
      };
    });
  }
}
