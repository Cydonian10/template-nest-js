import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../../../shared/pagination/paginated-response.dto.js';
import type { DetalleMovimiento } from '../../entities/detalle-movimiento.entity.js';
import {
  EstadoMovimientoInventario,
  TipoMovimientoInventario,
  type MovimientoInventario,
} from '../../entities/movimiento-inventario.entity.js';

const ESCALA = 1_000_000n;

function decimalEscalado(valor: string): bigint {
  const match = /^(-?)(\d+)(?:\.(\d{1,6}))?$/.exec(valor);
  if (!match) throw new Error('Decimal de movimiento no válido');
  const magnitud = BigInt(match[2] + (match[3] ?? '').padEnd(6, '0'));
  return match[1] ? -magnitud : magnitud;
}

function decimalTexto(valor: bigint): string {
  const magnitud = valor < 0n ? -valor : valor;
  const entero = magnitud / ESCALA;
  const decimales = (magnitud % ESCALA).toString().padStart(6, '0');
  return `${valor < 0n ? '-' : ''}${entero}.${decimales}`;
}

function valorCosto(detalles: readonly DetalleMovimiento[]): string | null {
  if (
    !detalles.length ||
    detalles.some((detalle) => detalle.costoTotal === null)
  ) {
    return null;
  }
  return decimalTexto(
    detalles.reduce(
      (total, detalle) => total + decimalEscalado(detalle.costoTotal!),
      0n,
    ),
  );
}

function costoPorUnidadBase(detalle: DetalleMovimiento): string | null {
  if (detalle.costoTotal === null) return null;
  const cantidad = decimalEscalado(detalle.cantidadBase);
  const divisor = cantidad < 0n ? -cantidad : cantidad;
  if (divisor === 0n) throw new Error('Cantidad base de movimiento no válida');
  const numerador = decimalEscalado(detalle.costoTotal) * ESCALA;
  return decimalTexto((numerador + divisor / 2n) / divisor);
}

export class HistorialMovimientoListadoResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() fecha: Date;
  @ApiProperty({ enum: TipoMovimientoInventario })
  tipo: TipoMovimientoInventario;
  @ApiProperty({ enum: [EstadoMovimientoInventario.CONFIRMADO] })
  estado: EstadoMovimientoInventario.CONFIRMADO;
  @ApiProperty({ nullable: true }) almacenOrigen: string | null;
  @ApiProperty({ nullable: true }) almacenDestino: string | null;
  @ApiProperty() cantidadDetalles: number;
  @ApiProperty({ nullable: true }) valorCosto: string | null;

  static from(
    movimiento: MovimientoInventario,
  ): HistorialMovimientoListadoResponseDto {
    const detalles = movimiento.detalles ?? [];
    return {
      id: movimiento.id,
      fecha: movimiento.fecha,
      tipo: movimiento.tipo,
      estado: EstadoMovimientoInventario.CONFIRMADO,
      almacenOrigen: movimiento.almacenOrigen?.nombre ?? null,
      almacenDestino: movimiento.almacenDestino?.nombre ?? null,
      cantidadDetalles: detalles.length,
      valorCosto: valorCosto(detalles),
    };
  }
}

export class HistorialDetalleLineaResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() producto: string;
  @ApiProperty() sku: string;
  @ApiProperty() cantidad: string;
  @ApiProperty() unidad: string;
  @ApiProperty() factorABase: string;
  @ApiProperty() cantidadBase: string;
  @ApiProperty({ nullable: true }) costoTotal: string | null;
  @ApiProperty({ nullable: true }) costoAplicado: string | null;

  static from(detalle: DetalleMovimiento): HistorialDetalleLineaResponseDto {
    return {
      id: detalle.id,
      producto: detalle.variante.producto.nombre,
      sku: detalle.variante.sku,
      cantidad: detalle.cantidad,
      unidad: detalle.unidad.nombre,
      factorABase: detalle.factorABase,
      cantidadBase: detalle.cantidadBase,
      costoTotal: detalle.costoTotal,
      costoAplicado: costoPorUnidadBase(detalle),
    };
  }
}

export class HistorialMovimientoDetalleResponseDto extends HistorialMovimientoListadoResponseDto {
  @ApiProperty() usuario: string;
  @ApiProperty({ format: 'uuid', nullable: true }) compraId: string | null;
  @ApiProperty({ nullable: true }) motivo: string | null;
  @ApiProperty({ type: [HistorialDetalleLineaResponseDto] })
  detalles: HistorialDetalleLineaResponseDto[];

  static from(
    movimiento: MovimientoInventario,
  ): HistorialMovimientoDetalleResponseDto {
    const resumen = HistorialMovimientoListadoResponseDto.from(movimiento);
    return {
      id: resumen.id,
      fecha: resumen.fecha,
      tipo: resumen.tipo,
      estado: resumen.estado,
      almacenOrigen: resumen.almacenOrigen,
      almacenDestino: resumen.almacenDestino,
      cantidadDetalles: resumen.cantidadDetalles,
      valorCosto: resumen.valorCosto,
      usuario: movimiento.usuario.nickName,
      compraId: movimiento.compra?.id ?? null,
      motivo: movimiento.motivo,
      detalles: movimiento.detalles.map((detalle) =>
        HistorialDetalleLineaResponseDto.from(detalle),
      ),
    };
  }
}

export class PaginatedHistorialMovimientosResponseDto {
  @ApiProperty({ type: [HistorialMovimientoListadoResponseDto] })
  data: HistorialMovimientoListadoResponseDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta: PaginationMetaDto;
}
