import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import type {
  CajaConTurnosResponseDto,
  TurnoCajaResponseDto,
} from '../../dto/caja-response/caja-con-turnos-response.dto.js';
import { ListarCajasQuery } from './listar-cajas.query.js';

interface CajaRow {
  id: string;
  codigo: string;
  nombre: string;
  activo: boolean;
  turnoId: string | null;
  usuarioAperturaId: string | null;
  usuarioAperturaNick: string | null;
  usuarioCierreId: string | null;
  usuarioCierreNick: string | null;
  fechaOperativa: string | null;
  fechaApertura: Date | null;
  fechaCierre: Date | null;
  saldoInicial: string | null;
  efectivoEsperado: string | null;
}

@QueryHandler(ListarCajasQuery)
export class ListarCajasHandler implements IQueryHandler<ListarCajasQuery> {
  constructor(private readonly dataSource: DataSource) {}

  async execute({
    filtros,
  }: ListarCajasQuery): Promise<CajaConTurnosResponseDto[]> {
    const activo =
      filtros.estado === 'todas' ? null : filtros.estado === 'activas';
    const rows: CajaRow[] = await this.dataSource.query(
      `SELECT c.id, c.codigo, c.nombre, c.activo,
        t.id AS "turnoId", ua.id AS "usuarioAperturaId", ua.nick_name AS "usuarioAperturaNick",
        uc.id AS "usuarioCierreId", uc.nick_name AS "usuarioCierreNick",
        t.fecha_operativa::text AS "fechaOperativa", t.fecha_apertura AS "fechaApertura",
        t.fecha_cierre AS "fechaCierre", t.saldo_inicial::text AS "saldoInicial",
        (CASE WHEN t.fecha_cierre IS NOT NULL THEN t.efectivo_esperado ELSE
          t.saldo_inicial
          + COALESCE((SELECT SUM(p.importe) FROM pagos_venta p JOIN ventas v ON v.id = p.venta_id WHERE v.turno_id = t.id AND p.medio = 'efectivo'), 0)
          - COALESCE((SELECT SUM(vu.importe) FROM vueltos_venta vu JOIN ventas v ON v.id = vu.venta_id WHERE v.turno_id = t.id AND vu.medio = 'efectivo'), 0)
          - COALESCE((SELECT SUM(r.importe) FROM reintegros_venta r JOIN devoluciones_venta d ON d.id = r.devolucion_id WHERE d.turno_id = t.id AND r.medio = 'efectivo'), 0)
          + COALESCE((SELECT SUM(CASE WHEN m.tipo = 'ingreso' THEN m.importe ELSE -m.importe END) FROM movimientos_caja m WHERE m.turno_id = t.id), 0)
        END)::text AS "efectivoEsperado"
       FROM cajas c
       LEFT JOIN turnos_caja t ON t.caja_id = c.id AND ($1::date IS NULL OR t.fecha_operativa = $1::date)
       LEFT JOIN users ua ON ua.id = t.usuario_apertura_id
       LEFT JOIN users uc ON uc.id = t.usuario_cierre_id
       WHERE ($2::boolean IS NULL OR c.activo = $2::boolean)
       ORDER BY c.codigo, c.id, t.fecha_apertura, t.id`,
      [filtros.fechaOperativa ?? null, activo],
    );

    const cajas = new Map<string, CajaConTurnosResponseDto>();
    for (const row of rows) {
      let caja = cajas.get(row.id);
      if (!caja) {
        caja = {
          id: row.id,
          codigo: row.codigo,
          nombre: row.nombre,
          activo: row.activo,
          turnos: [],
        };
        cajas.set(row.id, caja);
      }
      if (row.turnoId) {
        const turno: TurnoCajaResponseDto = {
          id: row.turnoId,
          usuarioApertura: {
            id: row.usuarioAperturaId!,
            nickName: row.usuarioAperturaNick!,
          },
          usuarioCierre: row.usuarioCierreId
            ? { id: row.usuarioCierreId, nickName: row.usuarioCierreNick! }
            : null,
          fechaOperativa: row.fechaOperativa!,
          fechaApertura: row.fechaApertura!,
          fechaCierre: row.fechaCierre,
          saldoInicial: row.saldoInicial!,
          efectivoEsperado: row.efectivoEsperado!,
        };
        caja.turnos.push(turno);
      }
    }
    return [...cajas.values()];
  }
}
