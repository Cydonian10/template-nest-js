import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { createHash } from 'node:crypto';
import { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { User } from '../../../../access-control/entities/user.entity.js';
import { MovimientoCaja } from '../../../entities/movimiento-caja.entity.js';
import { TurnoCaja } from '../../../entities/turno-caja.entity.js';
import { CrearMovimientoCajaSchema } from '../../dto/movimientos-caja.dto.js';
import { CrearMovimientoCajaCommand } from './crear-movimiento.command.js';

@CommandHandler(CrearMovimientoCajaCommand)
export class CrearMovimientoCajaHandler implements ICommandHandler<CrearMovimientoCajaCommand> {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(command: CrearMovimientoCajaCommand) {
    const parsed = CrearMovimientoCajaSchema.safeParse(command.data);
    if (!parsed.success || !command.clave?.trim() || command.clave.length > 128)
      throw new BadRequestException('Datos o clave de idempotencia inválidos');
    const data = parsed.data;
    const hash = createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
    const lockHash = createHash('sha256')
      .update(
        JSON.stringify(['movimiento-caja', command.usuarioId, command.clave]),
      )
      .digest('hex');
    const lock = BigInt.asIntN(
      64,
      BigInt(`0x${lockHash.slice(0, 16)}`),
    ).toString();
    return this.unitOfWork.execute(async (manager) => {
      await manager.query('SELECT pg_advisory_xact_lock($1::bigint)', [lock]);
      const usuario = await manager.findOneBy(User, {
        id: command.usuarioId,
        active: true,
      });
      if (!usuario) throw new UnauthorizedException();
      const anterior = await manager.findOne(MovimientoCaja, {
        where: {
          usuario: { id: usuario.id },
          idempotenciaClave: command.clave,
        },
      });
      if (anterior) {
        if (anterior.idempotenciaHash !== hash)
          throw new ConflictException(
            'La clave ya corresponde a otro movimiento',
          );
        return {
          id: anterior.id,
          turnoId: anterior.turnoId,
          tipo: anterior.tipo,
          importe: anterior.importe,
          motivo: anterior.motivo,
          fecha: anterior.fecha,
        };
      }
      const turno = await manager.findOne(TurnoCaja, {
        where: { id: data.turnoId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!turno) throw new NotFoundException('El turno no existe');
      if (turno.fechaCierre)
        throw new ConflictException('El turno está cerrado');
      if (data.tipo === 'egreso') {
        const [saldo] = (await manager.query(
          `SELECT (
          t.saldo_inicial
          + COALESCE((SELECT SUM(p.importe) FROM pagos_venta p JOIN ventas v ON v.id = p.venta_id WHERE v.turno_id = t.id AND p.medio = 'efectivo'), 0)
          - COALESCE((SELECT SUM(vu.importe) FROM vueltos_venta vu JOIN ventas v ON v.id = vu.venta_id WHERE v.turno_id = t.id AND vu.medio = 'efectivo'), 0)
          - COALESCE((SELECT SUM(r.importe) FROM reintegros_venta r JOIN devoluciones_venta d ON d.id = r.devolucion_id WHERE d.turno_id = t.id AND r.medio = 'efectivo'), 0)
          + COALESCE((SELECT SUM(CASE WHEN m.tipo = 'ingreso' THEN m.importe ELSE -m.importe END) FROM movimientos_caja m WHERE m.turno_id = t.id), 0)
          >= $2::numeric) AS suficiente FROM turnos_caja t WHERE t.id = $1`,
          [turno.id, data.importe],
        )) as { suficiente: boolean }[];
        if (!saldo?.suficiente)
          throw new ConflictException(
            'La salida supera el efectivo esperado de la caja',
          );
      }
      const movimiento = manager.create(MovimientoCaja, {
        turno: { id: turno.id },
        usuario: { id: usuario.id },
        tipo: data.tipo as MovimientoCaja['tipo'],
        importe: data.importe,
        motivo: data.motivo,
        idempotenciaClave: command.clave,
        idempotenciaHash: hash,
      });
      const guardado = await manager.save(MovimientoCaja, movimiento);
      return {
        id: guardado.id,
        turnoId: turno.id,
        tipo: guardado.tipo,
        importe: guardado.importe,
        motivo: guardado.motivo,
        fecha: guardado.fecha,
      };
    });
  }
}
