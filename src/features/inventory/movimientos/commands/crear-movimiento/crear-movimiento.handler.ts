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
import { calcularEntrada } from './calcular-entrada.js';
import { CrearMovimientoCommand } from './crear-movimiento.command.js';
import { validarMovimiento } from './validar-movimiento.js';
import type { DetalleValidado } from './validar-movimiento.js';

type SaldoBloqueado = { cantidad: string; valorCosto: string };
type Plan = {
  detalle: DetalleValidado;
  costoTotal: string;
  salida?: ReturnType<typeof calcularSalida>;
  entradaAlmacenId?: string;
};

@CommandHandler(CrearMovimientoCommand)
export class CrearMovimientoHandler implements ICommandHandler<CrearMovimientoCommand> {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(
    command: CrearMovimientoCommand,
  ): Promise<MovimientoInventario> {
    return this.unitOfWork.execute(async (manager) => {
      const { input, usuario, origen, destino, detalles } =
        await validarMovimiento(manager, command);

      // Bloquear todas las filas existentes en un único orden (incluidos los
      // destinos) evita ciclos entre traslados de sentido opuesto.
      const pares = detalles
        .flatMap((detalle) => [
          { varianteId: detalle.variante.id, almacenId: origen.id },
          ...(destino
            ? [{ varianteId: detalle.variante.id, almacenId: destino.id }]
            : []),
        ])
        .sort(
          (a, b) =>
            a.varianteId.localeCompare(b.varianteId) ||
            a.almacenId.localeCompare(b.almacenId),
        );
      const saldos = new Map<string, SaldoBloqueado | null>();
      for (const { varianteId, almacenId } of pares) {
        const rows = await manager.query<SaldoBloqueado[]>(
          `SELECT "cantidad", "valor_costo" AS "valorCosto" FROM "existencias"
           WHERE "variante_id" = $1 AND "almacen_id" = $2 FOR UPDATE`,
          [varianteId, almacenId],
        );
        saldos.set(`${varianteId}:${almacenId}`, rows[0] ?? null);
      }

      // No escribir hasta comprobar stock, catálogo y valoración de cada línea.
      const planes: Plan[] = detalles.map((detalle) => {
        const salida =
          input.tipo !== 'ajuste' || detalle.cantidadBase.startsWith('-');
        if (salida) {
          const saldo = saldos.get(`${detalle.variante.id}:${origen.id}`);
          if (!saldo) {
            throw new BadRequestException(
              'Stock insuficiente en el almacén de origen',
            );
          }
          const calculo = calcularSalida(
            saldo.cantidad,
            saldo.valorCosto,
            detalle.cantidadBase,
          );
          return {
            detalle,
            costoTotal: calculo.costoTotal,
            salida: calculo,
            ...(destino ? { entradaAlmacenId: destino.id } : {}),
          };
        }
        if (detalle.costoUnitarioBase === undefined) {
          throw new BadRequestException(
            'El costo unitario base es obligatorio',
          );
        }
        return {
          detalle,
          costoTotal: calcularEntrada(
            detalle.cantidadBase,
            detalle.costoUnitarioBase,
          ),
          entradaAlmacenId: origen.id,
        };
      });

      const movimiento = await manager.save(
        MovimientoInventario,
        manager.create(MovimientoInventario, {
          tipo:
            input.tipo === 'salida'
              ? TipoMovimientoInventario.SALIDA
              : input.tipo === 'traslado'
                ? TipoMovimientoInventario.TRASLADO
                : TipoMovimientoInventario.AJUSTE,
          estado: EstadoMovimientoInventario.CONFIRMADO,
          usuario,
          almacenOrigen: input.tipo === 'ajuste' ? null : origen,
          almacenDestino:
            input.tipo === 'traslado'
              ? destino
              : input.tipo === 'ajuste'
                ? origen
                : null,
          motivo: input.motivo ?? null,
          proveedor: null,
          compra: null,
          // La clave única evita duplicaciones; la respuesta al reintento
          // y la huella se completan en el paso 6.
          idempotenciaClave: input.idempotenciaClave,
          idempotenciaHash: null,
        }),
      );
      for (const plan of planes.sort((a, b) =>
        a.detalle.variante.id.localeCompare(b.detalle.variante.id),
      )) {
        await manager.save(
          DetalleMovimiento,
          manager.create(DetalleMovimiento, {
            movimiento,
            detalleCompra: null,
            variante: plan.detalle.variante,
            unidad: plan.detalle.unidad,
            cantidad: plan.detalle.cantidad,
            factorABase: plan.detalle.factorABase,
            cantidadBase: plan.detalle.cantidadBase,
            costoTotal: plan.costoTotal,
          }),
        );
        if (plan.salida) {
          await manager.update(
            Existencia,
            { varianteId: plan.detalle.variante.id, almacenId: origen.id },
            {
              cantidad: plan.salida.cantidadRestante,
              valorCosto: plan.salida.valorRestante,
            },
          );
        }
        if (plan.entradaAlmacenId) {
          // ON CONFLICT cubre destinos sin fila y entradas concurrentes sin
          // perder cantidades ni costo del saldo anterior.
          await manager.query(
            `INSERT INTO "existencias" ("variante_id", "almacen_id", "cantidad", "valor_costo")
             VALUES ($1, $2, $3::numeric, $4::numeric)
             ON CONFLICT ("variante_id", "almacen_id") DO UPDATE
             SET "cantidad" = "existencias"."cantidad" + EXCLUDED."cantidad",
                 "valor_costo" = "existencias"."valor_costo" + EXCLUDED."valor_costo"`,
            [
              plan.detalle.variante.id,
              plan.entradaAlmacenId,
              plan.detalle.cantidadBase.replace(/^-/, ''),
              plan.costoTotal,
            ],
          );
        }
      }
      return movimiento;
    });
  }
}
