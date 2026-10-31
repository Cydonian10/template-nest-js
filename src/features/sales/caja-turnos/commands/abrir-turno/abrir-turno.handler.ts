import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IsNull } from 'typeorm';
import { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { User } from '../../../../access-control/entities/user.entity.js';
import { Caja } from '../../../entities/caja.entity.js';
import {
  TipoCierreCaja,
  TurnoCaja,
} from '../../../entities/turno-caja.entity.js';
import { AbrirTurnoCommand } from './abrir-turno.command.js';

@CommandHandler(AbrirTurnoCommand)
export class AbrirTurnoHandler implements ICommandHandler<AbrirTurnoCommand> {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute({
    cajaId,
    usuarioId,
    data,
  }: AbrirTurnoCommand): Promise<TurnoCaja> {
    return this.unitOfWork.execute(async (manager) => {
      const caja = await manager.findOne(Caja, {
        where: { id: cajaId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!caja) throw new NotFoundException('La caja no existe');
      if (!caja.activo) throw new ConflictException('La caja está inactiva');

      const abierto = await manager.findOne(TurnoCaja, {
        where: { caja: { id: cajaId }, fechaCierre: IsNull() },
      });
      if (abierto)
        throw new ConflictException('La caja ya tiene un turno abierto');

      const [{ fechaOperativa, fechaApertura }]: {
        fechaOperativa: string;
        fechaApertura: Date;
      }[] = await manager.query(
        `SELECT (instante AT TIME ZONE 'America/Lima')::date::text AS "fechaOperativa", instante AS "fechaApertura" FROM (SELECT clock_timestamp() AS instante) reloj`,
      );
      const cierreDia = await manager.findOne(TurnoCaja, {
        where: {
          caja: { id: cajaId },
          fechaOperativa,
          tipoCierre: TipoCierreCaja.DIA,
        },
      });
      if (cierreDia) {
        throw new ConflictException(
          'La caja ya tiene un cierre de día para esta fecha operativa',
        );
      }
      const anterior = await manager.findOne(TurnoCaja, {
        where: { caja: { id: cajaId }, fechaOperativa },
        order: { fechaApertura: 'DESC', id: 'DESC' },
      });
      if (anterior && data.saldoInicial !== undefined) {
        throw new BadRequestException(
          'El saldo inicial se hereda del turno anterior',
        );
      }
      if (!anterior && data.saldoInicial === undefined) {
        throw new BadRequestException(
          'El saldo inicial es obligatorio para el primer turno del día',
        );
      }
      if (anterior && anterior.efectivoContado === null) {
        throw new ConflictException(
          'El turno anterior no tiene efectivo contado',
        );
      }
      return manager.save(TurnoCaja, {
        caja,
        usuarioApertura: { id: usuarioId } as User,
        fechaOperativa,
        fechaApertura,
        saldoInicial: anterior ? anterior.efectivoContado! : data.saldoInicial!,
      });
    });
  }
}
