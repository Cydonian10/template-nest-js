import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QueryFailedError } from 'typeorm';
import { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { User } from '../../../../access-control/entities/user.entity.js';
import { Compra } from '../../../entities/compra.entity.js';
import { CorreccionCompra } from '../../../entities/correccion-compra.entity.js';
import { Existencia } from '../../../entities/existencia.entity.js';
import {
  TipoMovimientoInventario,
  EstadoMovimientoInventario,
} from '../../../entities/movimiento-inventario.entity.js';
import { calcularRenglon, formatSix } from '../crear-compra/calculos-compra.js';
import { UpdateCompraSchema } from '../../dto/update-compra.dto.js';
import { EditarCompraCommand } from './editar-compra.command.js';

function scaled(value: string): bigint {
  const [whole, fraction = ''] = value.split('.');
  return BigInt(whole) * 1_000_000n + BigInt(fraction.padEnd(6, '0'));
}

function signedSix(value: bigint): string {
  return value < 0n ? `-${formatSix(-value)}` : formatSix(value);
}

@CommandHandler(EditarCompraCommand)
export class EditarCompraHandler implements ICommandHandler<EditarCompraCommand> {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute({ id, userId, data }: EditarCompraCommand): Promise<Compra> {
    const parsed = UpdateCompraSchema.safeParse(data);
    if (!parsed.success)
      throw new BadRequestException('Datos de compra no válidos');
    const input = parsed.data;
    if (
      new Set(input.precios.map((item) => item.renglonId)).size !==
      input.precios.length
    ) {
      throw new BadRequestException('Renglones repetidos');
    }

    try {
      return await this.unitOfWork.execute(async (manager) => {
        const usuario = await manager.findOneBy(User, {
          id: userId,
          active: true,
        });
        if (!usuario) throw new UnauthorizedException();
        // Serializa dos correcciones del mismo documento, incluso si cambian renglones diferentes.
        const locked = await manager.findOne(Compra, {
          where: { id },
          lock: { mode: 'pessimistic_write' },
        });
        if (!locked) throw new NotFoundException('Compra no encontrada');
        if (locked.revision !== input.revision) {
          throw new ConflictException(
            'La compra cambió. Actualiza el detalle antes de corregirla.',
          );
        }
        const compra = await manager.findOne(Compra, {
          where: { id },
          relations: {
            proveedor: true,
            detalles: { variante: true },
            movimientos: { almacenDestino: true },
          },
        });
        if (!compra) throw new NotFoundException('Compra no encontrada');
        const ingreso = compra.movimientos.find(
          (movimiento) =>
            movimiento.tipo === TipoMovimientoInventario.INGRESO &&
            movimiento.estado === EstadoMovimientoInventario.CONFIRMADO,
        );
        const precios = new Map(
          input.precios.map((item) => [item.renglonId, item.precioUnitario]),
        );
        if (
          precios.size !== compra.detalles.length ||
          compra.detalles.some((detalle) => !precios.has(detalle.id))
        ) {
          throw new BadRequestException(
            'Envía el precio de todos los renglones existentes',
          );
        }

        const anterior = {
          fecha: compra.fecha,
          tipoDocumento: compra.tipoDocumento,
          serieDocumento: compra.serieDocumento,
          numeroDocumento: compra.numeroDocumento,
          observaciones: compra.observaciones,
          totalDocumento: compra.totalDocumento,
          precios: compra.detalles.map((detalle) => ({
            renglonId: detalle.id,
            precioUnitario: detalle.precioUnitario,
          })),
        };
        const diferencias = new Map<string, bigint>();
        let total = 0n;
        for (const detalle of compra.detalles) {
          const precio = precios.get(detalle.id)!;
          const nuevo = calcularRenglon(
            detalle.cantidad,
            precio,
            detalle.factorABase,
          );
          const anteriorCosto = calcularRenglon(
            detalle.cantidad,
            detalle.precioUnitario,
            detalle.factorABase,
          );
          total += nuevo.costoEscalado;
          if (
            precio !== detalle.precioUnitario &&
            nuevo.costoEscalado !== anteriorCosto.costoEscalado
          ) {
            diferencias.set(
              detalle.variante.id,
              (diferencias.get(detalle.variante.id) ?? 0n) +
                nuevo.costoEscalado -
                anteriorCosto.costoEscalado,
            );
          }
        }
        for (const [varianteId, diferencia] of diferencias) {
          if (diferencia === 0n) diferencias.delete(varianteId);
        }
        const nuevo = {
          fecha: input.fecha,
          tipoDocumento: input.tipoDocumento,
          serieDocumento: input.serieDocumento,
          numeroDocumento: input.numeroDocumento,
          observaciones: input.observaciones || null,
          totalDocumento: compra.detalles.length
            ? formatSix(total)
            : compra.totalDocumento,
          precios: compra.detalles.map((detalle) => ({
            renglonId: detalle.id,
            precioUnitario: precios.get(detalle.id)!,
          })),
        };
        if (JSON.stringify(anterior) === JSON.stringify(nuevo)) return compra;

        if (diferencias.size) {
          if (!ingreso?.almacenDestino) {
            throw new ConflictException(
              'Esta compra no tiene un ingreso confirmado para corregir costos.',
            );
          }
          // No hay lotes: solo es seguro revaluar la entrada si no hubo otros movimientos
          // de esas variantes en el almacén desde que se recibió esta compra.
          for (const [varianteId, diferencia] of [...diferencias].sort(
            ([a], [b]) => a.localeCompare(b),
          )) {
            const saldo = await manager.findOne(Existencia, {
              where: { varianteId, almacenId: ingreso.almacenDestino.id },
              lock: { mode: 'pessimistic_write' },
            });
            if (!saldo)
              throw new ConflictException(
                'No hay saldo disponible para corregir el costo.',
              );
            const posteriores = await manager.query<[{ id: string }]>(
              `SELECT m.id FROM "detalle_movimiento" dm
               JOIN "movimientos_inventario" m ON m.id = dm.movimiento_id
               WHERE dm.variante_id = $1 AND m.id <> $2 AND m.fecha >= $3
                 AND (m.almacen_origen_id = $4 OR m.almacen_destino_id = $4)
                 AND m.estado = 'confirmado' LIMIT 1`,
              [
                varianteId,
                ingreso.id,
                ingreso.fecha,
                ingreso.almacenDestino.id,
              ],
            );
            if (posteriores.length) {
              throw new ConflictException(
                'No se puede cambiar el precio: ya existen movimientos posteriores de ese producto en el almacén. Puedes corregir los datos del documento sin cambiar precios.',
              );
            }
            const valor = scaled(saldo.valorCosto) + diferencia;
            if (valor < 0n || (scaled(saldo.cantidad) === 0n && valor !== 0n)) {
              throw new ConflictException(
                'La corrección dejaría un costo de inventario inválido.',
              );
            }
            saldo.valorCosto = signedSix(valor);
            await manager.save(Existencia, saldo);
          }
        }

        Object.assign(compra, {
          fecha: input.fecha,
          tipoDocumento: input.tipoDocumento,
          serieDocumento: input.serieDocumento,
          numeroDocumento: input.numeroDocumento,
          observaciones: input.observaciones || null,
          totalDocumento: compra.detalles.length
            ? formatSix(total)
            : compra.totalDocumento,
          revision: compra.revision + 1,
        });
        const modificados = compra.detalles.filter(
          (detalle) => detalle.precioUnitario !== precios.get(detalle.id),
        );
        for (const detalle of modificados) {
          detalle.precioUnitario = precios.get(detalle.id)!;
        }
        if (modificados.length) await manager.save(modificados);
        await manager.save(Compra, compra);
        await manager.save(
          CorreccionCompra,
          manager.create(CorreccionCompra, {
            compra,
            usuario,
            anterior,
            nuevo,
          }),
        );
        return compra;
      });
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { constraint?: string }).constraint ===
          'UQ_compras_proveedor_tipo_serie_numero'
      ) {
        throw new ConflictException(
          'El documento ya está registrado para este proveedor',
        );
      }
      throw error;
    }
  }
}
