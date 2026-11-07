import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { In } from 'typeorm';
import { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { User } from '../../../../access-control/entities/user.entity.js';
import { Almacen } from '../../../../inventory/entities/almacen.entity.js';
import { DetalleMovimiento } from '../../../../inventory/entities/detalle-movimiento.entity.js';
import { Existencia } from '../../../../inventory/entities/existencia.entity.js';
import {
  EstadoMovimientoInventario,
  MovimientoInventario,
  TipoMovimientoInventario,
} from '../../../../inventory/entities/movimiento-inventario.entity.js';
import { Producto } from '../../../../inventory/entities/producto.entity.js';
import { Unidad } from '../../../../inventory/entities/unidad.entity.js';
import { VarianteProducto } from '../../../../inventory/entities/variante-producto.entity.js';
import { calcularSalida } from '../../../../inventory/movimientos/commands/crear-movimiento/calcular-salida.js';
import { DetalleVenta } from '../../../entities/detalle-venta.entity.js';
import { PagoVenta, MedioPago } from '../../../entities/pago-venta.entity.js';
import { TurnoCaja } from '../../../entities/turno-caja.entity.js';
import { EstadoVenta, Venta } from '../../../entities/venta.entity.js';
import { VueltoVenta } from '../../../entities/vuelto-venta.entity.js';
import type { VentaCreadaResponseDto } from '../../dto/venta-creada-response.dto.js';
import type { EntityManager } from 'typeorm';
import {
  CrearVentaSchema,
  IdempotencyKeySchema,
} from '../../dto/crear-venta.dto.js';
import { calcularVenta } from './calcular-venta.js';
import { CrearVentaCommand } from './crear-venta.command.js';
import { bloqueoVenta, hashVenta } from './idempotencia-venta.js';

async function respuestaRegistrada(
  manager: EntityManager,
  id: string,
): Promise<VentaCreadaResponseDto> {
  const venta = await manager.findOneOrFail(Venta, {
    where: { id },
    relations: {
      turno: true,
      almacen: true,
      usuario: true,
      detalles: { variante: true, unidad: true },
      pagos: true,
      vueltos: true,
    },
  });
  const ordenar = <T extends { id: string }>(a: T, b: T) =>
    a.id.localeCompare(b.id);
  return {
    id: venta.id,
    fecha: venta.fecha,
    estado: EstadoVenta.CONFIRMADA,
    turnoId: venta.turno.id,
    almacenId: venta.almacen.id,
    usuarioId: venta.usuario.id,
    subtotal: venta.subtotal,
    descuentoPromocional: venta.descuentoPromocional,
    descuentoManual: venta.descuentoManual,
    baseImponible: venta.baseImponible,
    igv: venta.igv,
    total: venta.total,
    detalles: venta.detalles.sort(ordenar).map((detalle) => ({
      id: detalle.id,
      varianteId: detalle.variante.id,
      unidadId: detalle.unidad.id,
      cantidad: detalle.cantidad,
      factorABase: detalle.factorABase,
      cantidadBase: detalle.cantidadBase,
      precioUnitario: detalle.precioUnitario,
      subtotal: detalle.subtotal,
      descuentoPromocional: detalle.descuentoPromocional,
      descuentoManual: detalle.descuentoManual,
      total: detalle.total,
    })),
    pagos: venta.pagos
      .sort(ordenar)
      .map(({ id, medio, importe, fecha }) => ({ id, medio, importe, fecha })),
    vuelto: venta.vueltos.length
      ? {
          id: venta.vueltos[0].id,
          medio: MedioPago.EFECTIVO,
          importe: venta.vueltos[0].importe,
          fecha: venta.vueltos[0].fecha,
        }
      : null,
  };
}

@CommandHandler(CrearVentaCommand)
export class CrearVentaHandler implements ICommandHandler<CrearVentaCommand> {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(command: CrearVentaCommand): Promise<VentaCreadaResponseDto> {
    const resultado = CrearVentaSchema.safeParse(command.data);
    if (
      !resultado.success ||
      !IdempotencyKeySchema.safeParse(command.idempotenciaClave).success
    ) {
      throw new BadRequestException('Datos de venta no válidos');
    }
    const input = resultado.data;
    const hash = hashVenta(input);
    return this.unitOfWork.execute(async (manager) => {
      await manager.query('SELECT pg_advisory_xact_lock($1::bigint)', [
        bloqueoVenta(command.usuarioId, command.idempotenciaClave),
      ]);
      const usuario = await manager.findOneBy(User, {
        id: command.usuarioId,
        active: true,
      });
      if (!usuario) throw new UnauthorizedException();
      const anterior = await manager.findOne(Venta, {
        where: {
          usuario: { id: command.usuarioId },
          idempotenciaClave: command.idempotenciaClave,
        },
      });
      if (anterior) {
        if (anterior.idempotenciaHash !== hash)
          throw new ConflictException('La clave ya corresponde a otra venta');
        return respuestaRegistrada(manager, anterior.id);
      }
      const turno = await manager.findOne(TurnoCaja, {
        where: { id: input.turnoId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!turno) throw new NotFoundException('El turno no existe');
      if (turno.fechaCierre)
        throw new ConflictException('El turno está cerrado');
      if (turno.responsableId !== usuario.id)
        throw new ForbiddenException('Solo el responsable del turno puede registrar ventas');
      const almacen = await manager.findOneBy(Almacen, { id: input.almacenId });
      if (!almacen) throw new NotFoundException('El almacén no existe');
      if (!almacen.activo)
        throw new BadRequestException('El almacén no está disponible');

      const ids = [
        ...new Set(
          input.detalles.map(({ varianteId }) => varianteId.toLowerCase()),
        ),
      ];
      const referencias = await manager.find(VarianteProducto, {
        where: { id: In(ids) },
        relations: { producto: true },
      });
      if (referencias.length !== ids.length)
        throw new NotFoundException('La variante no existe');
      const productos = [
        ...new Set(referencias.map(({ producto }) => producto.id)),
      ].sort();
      for (const id of productos) {
        const producto = await manager.findOne(Producto, {
          where: { id },
          lock: { mode: 'pessimistic_read' },
        });
        if (!producto) throw new NotFoundException('El producto no existe');
      }
      const variantes = await manager.find(VarianteProducto, {
        where: { id: In(ids) },
        relations: {
          producto: { unidadBase: true, unidades: { unidad: true } },
        },
      });
      const porId = new Map(
        variantes.map((variante) => [variante.id.toLowerCase(), variante]),
      );
      const unidadIds = [
        ...new Set(
          input.detalles.map(({ unidadId }) => unidadId.toLowerCase()),
        ),
      ];
      const unidades = await manager.find(Unidad, {
        where: { id: In(unidadIds) },
      });
      if (unidades.length !== unidadIds.length)
        throw new NotFoundException('La unidad no existe');
      const lineas = input.detalles.map((detalle) => {
        const variante = porId.get(detalle.varianteId.toLowerCase());
        if (!variante) throw new NotFoundException('La variante no existe');
        if (!variante.activo || !variante.producto.activo) {
          throw new BadRequestException('La variante no está disponible');
        }
        const unidadId = detalle.unidadId.toLowerCase();
        const esBase =
          variante.producto.unidadBase.id.toLowerCase() === unidadId;
        const secundaria = variante.producto.unidades.find(
          ({ unidad }) => unidad.id.toLowerCase() === unidadId,
        );
        const factorABase = esBase ? '1' : secundaria?.factorABase;
        if (!factorABase)
          throw new BadRequestException('La unidad no pertenece al producto');
        return { ...detalle, factorABase, precioBase: variante.precio };
      });
      const calculo = calcularVenta(lineas, input.pagos);
      const saldos = new Map<
        string,
        { cantidad: string; valorCosto: string }
      >();
      for (const varianteId of ids.sort()) {
        const filas = await manager.query<
          { cantidad: string; valorCosto: string }[]
        >(
          `SELECT "cantidad", "valor_costo" AS "valorCosto" FROM "existencias" WHERE "variante_id" = $1 AND "almacen_id" = $2 FOR UPDATE`,
          [varianteId, almacen.id],
        );
        if (!filas[0]) throw new ConflictException('Stock insuficiente');
        saldos.set(varianteId, filas[0]);
      }
      const planes = calculo.detalles.map((detalle) => {
        const id = detalle.varianteId.toLowerCase();
        const saldo = saldos.get(id)!;
        let salida: ReturnType<typeof calcularSalida>;
        try {
          salida = calcularSalida(
            saldo.cantidad,
            saldo.valorCosto,
            detalle.cantidadBase,
          );
        } catch (error) {
          if (error instanceof BadRequestException)
            throw new ConflictException('Stock insuficiente');
          throw error;
        }
        saldos.set(id, {
          cantidad: salida.cantidadRestante,
          valorCosto: salida.valorRestante,
        });
        return { detalle, salida };
      });
      const movimiento = await manager.save(
        MovimientoInventario,
        manager.create(MovimientoInventario, {
          tipo: TipoMovimientoInventario.SALIDA,
          estado: EstadoMovimientoInventario.CONFIRMADO,
          usuario,
          almacenOrigen: almacen,
          almacenDestino: null,
          motivo: null,
          proveedor: null,
          compra: null,
          idempotenciaClave: null,
          idempotenciaHash: null,
        }),
      );
      const venta = await manager.save(
        Venta,
        manager.create(Venta, {
          turno,
          almacen,
          usuario,
          movimientoInventario: movimiento,
          estado: EstadoVenta.CONFIRMADA,
          idempotenciaClave: command.idempotenciaClave,
          idempotenciaHash: hash,
          subtotal: calculo.subtotal,
          descuentoPromocional: calculo.descuentoPromocional,
          descuentoManual: calculo.descuentoManual,
          baseImponible: calculo.baseImponible,
          igv: calculo.igv,
          total: calculo.total,
        }),
      );
      for (const { detalle, salida } of planes) {
        const variante = { id: detalle.varianteId } as VarianteProducto;
        const unidad = { id: detalle.unidadId } as Unidad;
        await manager.save(
          DetalleMovimiento,
          manager.create(DetalleMovimiento, {
            movimiento,
            detalleCompra: null,
            variante,
            unidad,
            cantidad: detalle.cantidad,
            factorABase: detalle.factorABase,
            cantidadBase: detalle.cantidadBase,
            costoTotal: salida.costoTotal,
          }),
        );
        await manager.save(
          DetalleVenta,
          manager.create(DetalleVenta, { ...detalle, venta, variante, unidad }),
        );
      }
      for (const [varianteId, saldo] of saldos) {
        await manager.update(
          Existencia,
          { varianteId, almacenId: almacen.id },
          saldo,
        );
      }
      for (const pago of calculo.pagos) {
        await manager.save(
          PagoVenta,
          manager.create(PagoVenta, { venta, ...pago }),
        );
      }
      if (calculo.vuelto) {
        await manager.save(
          VueltoVenta,
          manager.create(VueltoVenta, { venta, ...calculo.vuelto }),
        );
      }
      return respuestaRegistrada(manager, venta.id);
    });
  }
}
