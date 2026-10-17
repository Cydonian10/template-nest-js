import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { In, QueryFailedError } from 'typeorm';
import { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { User } from '../../../../access-control/entities/user.entity.js';
import { Almacen } from '../../../entities/almacen.entity.js';
import { Compra } from '../../../entities/compra.entity.js';
import { DetalleCompra } from '../../../entities/detalle-compra.entity.js';
import { DetalleMovimiento } from '../../../entities/detalle-movimiento.entity.js';
import {
  MovimientoInventario,
  EstadoMovimientoInventario,
  TipoMovimientoInventario,
} from '../../../entities/movimiento-inventario.entity.js';
import { Proveedor } from '../../../entities/proveedor.entity.js';
import { VarianteProducto } from '../../../entities/variante-producto.entity.js';
import type { UnidadProducto } from '../../../entities/unidad-producto.entity.js';
import { CreateCompraSchema } from '../../dto/create-compra.dto.js';
import { calcularRenglon, formatSix } from './calculos-compra.js';
import { CrearCompraCommand } from './crear-compra.command.js';

@CommandHandler(CrearCompraCommand)
export class CrearCompraHandler implements ICommandHandler<CrearCompraCommand> {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute({ userId, data }: CrearCompraCommand): Promise<Compra> {
    const parsed = CreateCompraSchema.safeParse(data);
    if (!parsed.success)
      throw new BadRequestException('Datos de compra no válidos');
    const input = parsed.data;

    try {
      return await this.unitOfWork.execute(async (manager) => {
        const [usuario, proveedor, almacen] = await Promise.all([
          manager.findOneBy(User, { id: userId, active: true }),
          manager.findOneBy(Proveedor, { id: input.proveedorId }),
          manager.findOneBy(Almacen, { id: input.almacenId, activo: true }),
        ]);
        if (!usuario) throw new UnauthorizedException();
        if (!proveedor)
          throw new BadRequestException('Proveedor no disponible');
        if (!almacen) throw new BadRequestException('Almacén no disponible');

        const variantes = await manager.find(VarianteProducto, {
          where: {
            id: In([...new Set(input.renglones.map((r) => r.varianteId))]),
          },
          relations: {
            producto: { unidadBase: true, unidades: { unidad: true } },
          },
        });
        const porId = new Map(
          variantes.map((variante) => [variante.id, variante]),
        );

        // Se valida todo antes de la primera escritura para fallar con errores claros.
        const renglones = input.renglones.map((renglon) => {
          const variante = porId.get(renglon.varianteId);
          if (!variante?.activo || !variante.producto.activo) {
            throw new BadRequestException('Variante no disponible');
          }
          const producto = variante.producto;
          const secundaria = producto.unidades.find(
            (item: UnidadProducto) => item.unidad.id === renglon.unidadId,
          );
          const esBase = renglon.unidadId === producto.unidadBase.id;
          const unidad = esBase ? producto.unidadBase : secundaria?.unidad;
          const factor = esBase ? '1' : secundaria?.factorABase;
          if (!unidad || !factor)
            throw new BadRequestException('Unidad no válida para el producto');

          return {
            renglon,
            variante,
            unidad,
            factor,
            ...calcularRenglon(
              renglon.cantidad,
              renglon.precioUnitario,
              factor,
            ),
          };
        });

        const total = renglones.reduce(
          (sum, renglon) => sum + renglon.costoEscalado,
          0n,
        );
        const compra = await manager.save(
          Compra,
          manager.create(Compra, {
            proveedor,
            usuario,
            fecha: input.fecha,
            tipoDocumento: input.tipoDocumento,
            serieDocumento: input.serieDocumento,
            numeroDocumento: input.numeroDocumento,
            totalDocumento: formatSix(total),
            observaciones: input.observaciones ?? null,
          }),
        );
        const movimiento = await manager.save(
          MovimientoInventario,
          manager.create(MovimientoInventario, {
            tipo: TipoMovimientoInventario.INGRESO,
            estado: EstadoMovimientoInventario.CONFIRMADO,
            usuario,
            proveedor,
            compra,
            almacenOrigen: null,
            almacenDestino: almacen,
            motivo: null,
          }),
        );

        // Orden fijo de las filas de existencia para evitar bloqueos cruzados.
        for (const item of renglones.sort((a, b) =>
          a.variante.id.localeCompare(b.variante.id),
        )) {
          const detalle = await manager.save(
            DetalleCompra,
            manager.create(DetalleCompra, {
              compra,
              variante: item.variante,
              unidad: item.unidad,
              cantidad: item.renglon.cantidad,
              factorABase: item.factor,
              precioUnitario: item.renglon.precioUnitario,
            }),
          );
          await manager.save(
            DetalleMovimiento,
            manager.create(DetalleMovimiento, {
              movimiento,
              detalleCompra: detalle,
              variante: item.variante,
              unidad: item.unidad,
              cantidad: item.renglon.cantidad,
              factorABase: item.factor,
              cantidadBase: item.cantidadBase,
              costoTotal: item.costoTotal,
            }),
          );

          // ON CONFLICT suma en la misma transacción sin perder ingresos concurrentes.
          await manager.query(
            `INSERT INTO "existencias" ("variante_id", "almacen_id", "cantidad", "valor_costo") VALUES ($1, $2, $3::numeric, $4::numeric)
             ON CONFLICT ("variante_id", "almacen_id") DO UPDATE
             SET "cantidad" = "existencias"."cantidad" + EXCLUDED."cantidad",
                 "valor_costo" = "existencias"."valor_costo" + EXCLUDED."valor_costo"`,
            [item.variante.id, almacen.id, item.cantidadBase, item.costoTotal],
          );
        }

        return compra;
      });
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { constraint?: string }).constraint ===
          'UQ_compras_proveedor_tipo_serie_numero'
      ) {
        throw new ConflictException(
          'El comprobante ya está registrado para este proveedor',
        );
      }
      throw error;
    }
  }
}
