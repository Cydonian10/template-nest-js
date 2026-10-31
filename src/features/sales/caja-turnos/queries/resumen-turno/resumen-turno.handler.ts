import { ConflictException, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import type { ResumenTurnoResponseDto } from '../../dto/resumen-turno/resumen-turno-response.dto.js';
import { ResumenTurnoQuery } from './resumen-turno.query.js';

interface ResumenTurnoRow extends ResumenTurnoResponseDto {
  fechaCierre: Date | null;
}

@QueryHandler(ResumenTurnoQuery)
export class ResumenTurnoHandler implements IQueryHandler<ResumenTurnoQuery> {
  constructor(private readonly dataSource: DataSource) {}

  async execute({
    cajaId,
    turnoId,
  }: ResumenTurnoQuery): Promise<ResumenTurnoResponseDto> {
    const rows: ResumenTurnoRow[] = await this.dataSource.query(
      `WITH componentes AS (
        SELECT t.id, t.caja_id, t.fecha_cierre, t.saldo_inicial,
          COALESCE((SELECT SUM(p.importe) FROM pagos_venta p JOIN ventas v ON v.id = p.venta_id WHERE v.turno_id = t.id AND p.medio = 'efectivo'), 0.00) AS cobros,
          COALESCE((SELECT SUM(vu.importe) FROM vueltos_venta vu JOIN ventas v ON v.id = vu.venta_id WHERE v.turno_id = t.id AND vu.medio = 'efectivo'), 0.00) AS vueltos,
          COALESCE((SELECT SUM(m.importe) FROM movimientos_caja m WHERE m.turno_id = t.id AND m.tipo = 'ingreso'), 0.00) AS ingresos,
          COALESCE((SELECT SUM(m.importe) FROM movimientos_caja m WHERE m.turno_id = t.id AND m.tipo = 'egreso'), 0.00) AS egresos,
          COALESCE((SELECT SUM(r.importe) FROM reintegros_venta r JOIN devoluciones_venta d ON d.id = r.devolucion_id WHERE d.turno_id = t.id AND r.medio = 'efectivo'), 0.00) AS reintegros
        FROM turnos_caja t WHERE t.id = $1 AND t.caja_id = $2
      )
      SELECT id, caja_id AS "cajaId", fecha_cierre AS "fechaCierre",
        saldo_inicial::text AS "saldoInicial", cobros::text AS "cobrosEfectivo",
        vueltos::text AS "vueltosEfectivo", ingresos::text AS "ingresosManuales",
        egresos::text AS "egresosManuales", reintegros::text AS "reintegrosEfectivo",
        (saldo_inicial + cobros - vueltos + ingresos - egresos - reintegros)::text AS "efectivoEsperado"
      FROM componentes`,
      [turnoId, cajaId],
    );
    const row = rows[0];
    if (!row) throw new NotFoundException('El turno no existe en esta caja');
    if (row.fechaCierre)
      throw new ConflictException('El turno ya está cerrado');

    const { fechaCierre: _fechaCierre, ...resumen } = row;
    return resumen;
  }
}
