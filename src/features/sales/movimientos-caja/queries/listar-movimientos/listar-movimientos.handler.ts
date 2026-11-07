import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { ListarMovimientosCajaQuery } from './listar-movimientos.query.js';

@QueryHandler(ListarMovimientosCajaQuery)
export class ListarMovimientosCajaHandler implements IQueryHandler<ListarMovimientosCajaQuery> {
  constructor(private readonly dataSource: DataSource) {}

  async execute({ filtros }: ListarMovimientosCajaQuery) {
    const condiciones = `m.fecha >= ($1::date::timestamp AT TIME ZONE 'America/Lima') AND m.fecha < (($2::date + 1)::timestamp AT TIME ZONE 'America/Lima')`;
    const [{ total }] = (await this.dataSource.query(
      `SELECT COUNT(*)::int AS total FROM movimientos_caja m WHERE ${condiciones}`,
      [filtros.desde, filtros.hasta],
    )) as { total: number }[];
    const data: unknown[] = await this.dataSource.query(
      `SELECT m.id, m.tipo, m.importe::text AS importe, m.motivo, m.fecha,
      c.id AS "cajaId", c.nombre AS "cajaNombre", c.codigo AS "cajaCodigo", t.id AS "turnoId", t.fecha_operativa::text AS "fechaOperativa",
      u.id AS "usuarioId", u.nick_name AS "usuarioNombre", r.id AS "responsableId", r.nick_name AS "responsableNombre"
      FROM movimientos_caja m JOIN turnos_caja t ON t.id = m.turno_id JOIN cajas c ON c.id = t.caja_id
      JOIN users u ON u.id = m.usuario_id JOIN users r ON r.id = t.responsable_id
      WHERE ${condiciones} ORDER BY m.fecha DESC, m.id DESC LIMIT $3 OFFSET $4`,
      [
        filtros.desde,
        filtros.hasta,
        filtros.limit,
        (filtros.page - 1) * filtros.limit,
      ],
    );
    return { data, total, page: filtros.page, limit: filtros.limit };
  }
}
