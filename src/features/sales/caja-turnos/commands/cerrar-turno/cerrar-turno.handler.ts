import { ConflictException, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { TurnoCaja } from '../../../entities/turno-caja.entity.js';
import { CerrarTurnoCommand } from './cerrar-turno.command.js';

export interface CierreTurnoResultado {
  id: string;
  cajaId: string;
  usuarioCierreId: string;
  fechaCierre: Date;
  saldoInicial: string;
  efectivoEsperado: string;
  efectivoContado: string;
  diferencia: string;
  tipoCierre: string;
}

@CommandHandler(CerrarTurnoCommand)
export class CerrarTurnoHandler implements ICommandHandler<CerrarTurnoCommand> {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute({ cajaId, turnoId, usuarioId, data }: CerrarTurnoCommand): Promise<CierreTurnoResultado> {
    return this.unitOfWork.execute(async (manager) => {
      const turno = await manager.findOne(TurnoCaja, {
        where: { id: turnoId, caja: { id: cajaId } },
        lock: { mode: 'pessimistic_write' },
      });
      if (!turno) throw new NotFoundException('El turno no existe en esta caja');
      if (turno.fechaCierre) throw new ConflictException('El turno ya está cerrado');

      const [resultado]: CierreTurnoResultado[] = await manager.query(
        `WITH calculo AS (
          SELECT t.id, t.saldo_inicial
            + COALESCE((SELECT SUM(p.importe) FROM pagos_venta p JOIN ventas v ON v.id = p.venta_id WHERE v.turno_id = t.id AND p.medio = 'efectivo'), 0)
            - COALESCE((SELECT SUM(vu.importe) FROM vueltos_venta vu JOIN ventas v ON v.id = vu.venta_id WHERE v.turno_id = t.id AND vu.medio = 'efectivo'), 0)
            - COALESCE((SELECT SUM(r.importe) FROM reintegros_venta r JOIN devoluciones_venta d ON d.id = r.devolucion_id WHERE d.turno_id = t.id AND r.medio = 'efectivo'), 0)
            + COALESCE((SELECT SUM(CASE WHEN m.tipo = 'ingreso' THEN m.importe ELSE -m.importe END) FROM movimientos_caja m WHERE m.turno_id = t.id), 0) AS esperado
          FROM turnos_caja t WHERE t.id = $1
        )
        UPDATE turnos_caja t SET
          fecha_cierre = clock_timestamp(), usuario_cierre_id = $2,
          efectivo_esperado = calculo.esperado, efectivo_contado = $3::numeric,
          diferencia = $3::numeric - calculo.esperado, tipo_cierre = 'turno'
        FROM calculo WHERE t.id = calculo.id
        RETURNING t.id, t.caja_id AS "cajaId", t.usuario_cierre_id AS "usuarioCierreId",
          t.fecha_cierre AS "fechaCierre", t.saldo_inicial::text AS "saldoInicial",
          t.efectivo_esperado::text AS "efectivoEsperado", t.efectivo_contado::text AS "efectivoContado",
          t.diferencia::text AS diferencia, t.tipo_cierre AS "tipoCierre"`,
        [turnoId, usuarioId, data.efectivoContado],
      );
      return resultado;
    });
  }
}
