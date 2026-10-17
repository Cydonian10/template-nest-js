import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../../../shared/pagination/paginated-response.dto.js';
import type { Compra } from '../../entities/compra.entity.js';
import type { ComprobanteCompra } from '../../entities/comprobante-compra.entity.js';
import {
  EstadoMovimientoInventario,
  TipoMovimientoInventario,
} from '../../entities/movimiento-inventario.entity.js';

export class ProveedorCompraResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() nombre: string;
}

export class AlmacenCompraResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() nombre: string;
}

export class IngresoCompraResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() fecha: Date;
  @ApiProperty() estado: EstadoMovimientoInventario;
}

export class ComprobanteCompraResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() nombreOriginal: string;
  @ApiProperty() tipoMime: string;
  @ApiProperty() tamanoBytes: number;
  @ApiProperty() fechaSubida: Date;

  static from(comprobante: ComprobanteCompra): ComprobanteCompraResponseDto {
    return {
      id: comprobante.id,
      nombreOriginal: comprobante.nombreOriginal,
      tipoMime: comprobante.tipoMime,
      tamanoBytes: comprobante.tamanoBytes,
      fechaSubida: comprobante.fechaSubida,
    };
  }
}

export class RenglonCompraResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) varianteId: string;
  @ApiProperty() productoNombre: string;
  @ApiProperty() sku: string;
  @ApiProperty({ format: 'uuid' }) unidadId: string;
  @ApiProperty() unidadNombre: string;
  @ApiProperty() unidadSimbolo: string;
  @ApiProperty() cantidad: string;
  @ApiProperty() factorABase: string;
  @ApiProperty() precioUnitario: string;
}

export class CompraListadoResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() fecha: string;
  @ApiProperty() fechaRegistro: Date;
  @ApiProperty({ nullable: true }) tipoDocumento: Compra['tipoDocumento'];
  @ApiProperty({ nullable: true }) serieDocumento: string | null;
  @ApiProperty({ nullable: true }) numeroDocumento: string | null;
  @ApiProperty({ nullable: true }) totalDocumento: string | null;
  @ApiProperty({ type: ProveedorCompraResponseDto })
  proveedor: ProveedorCompraResponseDto;
  @ApiProperty({ type: AlmacenCompraResponseDto, nullable: true })
  almacen: AlmacenCompraResponseDto | null;
  @ApiProperty() cantidadRenglones: number;

  static from(compra: Compra): CompraListadoResponseDto {
    const ingreso = compra.movimientos?.find(
      (movimiento) =>
        movimiento.tipo === TipoMovimientoInventario.INGRESO &&
        movimiento.estado === EstadoMovimientoInventario.CONFIRMADO,
    );
    const almacen = ingreso?.almacenDestino;
    return {
      id: compra.id,
      fecha: compra.fecha,
      fechaRegistro: compra.fechaRegistro,
      tipoDocumento: compra.tipoDocumento,
      serieDocumento: compra.serieDocumento,
      numeroDocumento: compra.numeroDocumento,
      totalDocumento: compra.totalDocumento,
      proveedor: { id: compra.proveedor.id, nombre: compra.proveedor.nombre },
      almacen: almacen ? { id: almacen.id, nombre: almacen.nombre } : null,
      cantidadRenglones: compra.detalles?.length ?? 0,
    };
  }
}

export class CompraDetalleResponseDto extends CompraListadoResponseDto {
  @ApiProperty({ nullable: true }) observaciones: string | null;
  @ApiProperty({ type: IngresoCompraResponseDto, nullable: true })
  ingreso: IngresoCompraResponseDto | null;
  @ApiProperty({ type: [RenglonCompraResponseDto] })
  renglones: RenglonCompraResponseDto[];
  @ApiProperty({ type: ComprobanteCompraResponseDto, nullable: true })
  comprobante: ComprobanteCompraResponseDto | null;

  static from(compra: Compra): CompraDetalleResponseDto {
    const ingreso = compra.movimientos?.find(
      (movimiento) =>
        movimiento.tipo === TipoMovimientoInventario.INGRESO &&
        movimiento.estado === EstadoMovimientoInventario.CONFIRMADO,
    );
    const comprobante = compra.comprobantes?.[0];
    return Object.assign(CompraListadoResponseDto.from(compra), {
      observaciones: compra.observaciones,
      ingreso: ingreso
        ? { id: ingreso.id, fecha: ingreso.fecha, estado: ingreso.estado }
        : null,
      renglones: (compra.detalles ?? []).map((detalle) => ({
        id: detalle.id,
        varianteId: detalle.variante.id,
        productoNombre: detalle.variante.producto.nombre,
        sku: detalle.variante.sku,
        unidadId: detalle.unidad.id,
        unidadNombre: detalle.unidad.nombre,
        unidadSimbolo: detalle.unidad.simbolo,
        cantidad: detalle.cantidad,
        factorABase: detalle.factorABase,
        precioUnitario: detalle.precioUnitario,
      })),
      comprobante: comprobante
        ? ComprobanteCompraResponseDto.from(comprobante)
        : null,
    });
  }
}

export class PaginatedComprasResponseDto {
  @ApiProperty({ type: [CompraListadoResponseDto] })
  data: CompraListadoResponseDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta: PaginationMetaDto;
}
