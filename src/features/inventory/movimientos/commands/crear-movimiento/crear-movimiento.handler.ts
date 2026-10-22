import { BadRequestException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { DetalleMovimiento } from '../../../entities/detalle-movimiento.entity.js';
import { Existencia } from '../../../entities/existencia.entity.js';
import {
  EstadoMovimientoInventario,
  MovimientoInventario,
  TipoMovimientoInventario,
} from '../../../entities/movimiento-inventario.entity.js';
import { calcularSalida } from './calcular-salida.js';
import { CrearMovimientoCommand } from './crear-movimiento.command.js';
import { validarMovimiento } from './validar-movimiento.js';

type SaldoBloqueado = { cantidad: string; valorCosto: string };

@CommandHandler(CrearMovimientoCommand)
export class CrearMovimientoHandler implements ICommandHandler<CrearMovimientoCommand> {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(
    command: CrearMovimientoCommand,
  ): Promise<MovimientoInventario> {
    // Las otras operaciones se habilitan en el siguiente paso; nunca confirmar una parte.
    if (
      command.data.tipo === 'traslado' ||
      (command.data.detalles?.some(
        (detalle) => !detalle.cantidad.startsWith('-'),
      ) &&
        command.data.tipo === 'ajuste')
    ) {
      throw new BadRequestException(
        'Este tipo de movimiento aún no está disponible',
      );
    }

    return this.unitOfWork.execute(async (manager) => {
      const { input, usuario, origen, detalles } = await validarMovimiento(
        manager,
        command,
      );

      // El orden fijo de los bloqueos evita interbloqueos entre movimientos.
      // Se valida todo el saldo antes de escribir el movimiento o sus detalles.
      const salidas = [];
      for (const detalle of [...detalles].sort((a, b) =>
        a.variante.id.localeCompare(b.variante.id),
      )) {
        const rows = await manager.query<SaldoBloqueado[]>(
          `SELECT "cantidad", "valor_costo" AS "valorCosto" FROM "existencias"
           WHERE "variante_id" = $1 AND "almacen_id" = $2 FOR UPDATE`,
          [detalle.variante.id, origen.id],
        );
        if (!rows.length)
          throw new BadRequestException(
            'Stock insuficiente en el almacén de origen',
          );
        salidas.push({
          detalle,
          ...calcularSalida(
            rows[0].cantidad,
            rows[0].valorCosto,
            detalle.cantidadBase,
          ),
        });
      }

      const movimiento = await manager.save(
        MovimientoInventario,
        manager.create(MovimientoInventario, {
          tipo:
            input.tipo === 'salida'
              ? TipoMovimientoInventario.SALIDA
              : TipoMovimientoInventario.AJUSTE,
          estado: EstadoMovimientoInventario.CONFIRMADO,
          usuario,
          almacenOrigen: input.tipo === 'salida' ? origen : null,
          almacenDestino: input.tipo === 'ajuste' ? origen : null,
          motivo: input.motivo ?? null,
          proveedor: null,
          compra: null,
          // La clave única ya bloquea duplicaciones; el replay con la misma
          // respuesta y la huella se completan en el paso 6.
          idempotenciaClave: input.idempotenciaClave,
          idempotenciaHash: null,
        }),
      );
      for (const salida of salidas) {
        await manager.save(
          DetalleMovimiento,
          manager.create(DetalleMovimiento, {
            movimiento,
            detalleCompra: null,
            variante: salida.detalle.variante,
            unidad: salida.detalle.unidad,
            cantidad: salida.detalle.cantidad,
            factorABase: salida.detalle.factorABase,
            cantidadBase: salida.detalle.cantidadBase,
            costoTotal: salida.costoTotal,
          }),
        );
        await manager.update(
          Existencia,
          { varianteId: salida.detalle.variante.id, almacenId: origen.id },
          {
            cantidad: salida.cantidadRestante,
            valorCosto: salida.valorRestante,
          },
        );
      }
      return movimiento;
    });
  }
}
