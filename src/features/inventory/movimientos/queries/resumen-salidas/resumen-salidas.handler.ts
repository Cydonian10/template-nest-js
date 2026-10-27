import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { Almacen } from '../../../entities/almacen.entity.js';
import { MovimientoInventario } from '../../../entities/movimiento-inventario.entity.js';
import { completarDias } from '../../../resumen-actividad.js';
import type { SalidaRecienteDto, ResumenSalidasDto } from '../../dto/resumen-salidas.dto.js';
import { ResumenSalidasQuery } from './resumen-salidas.query.js';

@QueryHandler(ResumenSalidasQuery)
export class ResumenSalidasHandler implements IQueryHandler<ResumenSalidasQuery> {
  constructor(
    @InjectRepository(MovimientoInventario)
    private readonly movimientos: Repository<MovimientoInventario>,
  ) {}

  async execute({ filter }: ResumenSalidasQuery): Promise<ResumenSalidasDto> {
    return this.movimientos.manager.transaction('REPEATABLE READ', async (manager) => {
      const { almacenId, desde, hasta } = filter;
      if (almacenId !== 'todos') {
        const existe = await manager.getRepository(Almacen).existsBy({ id: almacenId, activo: true });
        if (!existe) throw new ResourceNotFoundException('Almacén activo', almacenId);
      }
      const condiciones = `m."tipo" = 'salida' AND m."estado" = 'confirmado'
        AND m."fecha" >= ($1::date::timestamp AT TIME ZONE 'America/Lima')
        AND m."fecha" < (($2::date + 1)::timestamp AT TIME ZONE 'America/Lima')
        AND ($3::uuid IS NULL OR m."almacen_origen_id" = $3::uuid)`;
      const params = [desde, hasta, almacenId === 'todos' ? null : almacenId];
      const porDia = await manager.query<{ fecha: string; cantidad: string }[]>(
        `SELECT (m."fecha" AT TIME ZONE 'America/Lima')::date::text AS "fecha",
                count(*)::text AS "cantidad"
         FROM "movimientos_inventario" m WHERE ${condiciones}
         GROUP BY (m."fecha" AT TIME ZONE 'America/Lima')::date
         ORDER BY (m."fecha" AT TIME ZONE 'America/Lima')::date`,
        params,
      );
      const recientes = await manager.query<(Omit<SalidaRecienteDto, 'cantidadDetalles'> & { cantidadDetalles: string })[]>(
        `SELECT m."id", m."fecha"::text AS "fecha",
                a."id" AS "almacenOrigenId", a."nombre" AS "almacenOrigenNombre",
                (SELECT count(*)::text FROM "detalle_movimiento" d WHERE d."movimiento_id" = m."id") AS "cantidadDetalles"
         FROM "movimientos_inventario" m
         JOIN "almacenes" a ON a."id" = m."almacen_origen_id"
         WHERE ${condiciones} ORDER BY m."fecha" DESC, m."id" DESC LIMIT 5`,
        params,
      );
      const dias = completarDias(filter, porDia);
      return {
        total: dias.reduce((total, dia) => total + dia.cantidad, 0),
        porDia: dias,
        recientes: recientes.map((salida) => ({
          ...salida,
          cantidadDetalles: Number(salida.cantidadDetalles),
        })),
      };
    });
  }
}
