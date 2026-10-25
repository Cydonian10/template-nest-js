import { describe, expect, it } from 'vitest';
import {
  TipoMovimientoInventario,
  type MovimientoInventario,
} from '../../entities/movimiento-inventario.entity.js';
import {
  HistorialMovimientoDetalleResponseDto,
  HistorialMovimientoListadoResponseDto,
} from './historial-movimiento-response.dto.js';

function movimientoConDetalles(
  detalles: Record<string, unknown>[],
): MovimientoInventario {
  return {
    id: 'ab1306f3-ce75-4985-a684-26936cf00425',
    fecha: new Date('2026-10-24T10:00:00Z'),
    tipo: 'ajuste',
    estado: 'confirmado',
    almacenOrigen: null,
    almacenDestino: { nombre: 'Central' },
    usuario: { nickName: 'Operadora' },
    compra: null,
    motivo: 'Conteo',
    detalles,
  } as unknown as MovimientoInventario;
}

function linea(cantidadBase: string, costoTotal: string | null) {
  return {
    id: 'bd6c1396-1273-4c23-994f-95f7d8c65511',
    cantidad: '-3',
    cantidadBase,
    factorABase: '1.00000000',
    costoTotal,
    variante: { sku: 'SKU-1', producto: { nombre: 'Tornillo' } },
    unidad: { nombre: 'unidad' },
  };
}

describe('HistorialMovimientoResponseDto', () => {
  it('devuelve un resumen sin líneas y suma costos decimales sin pérdida de precisión', () => {
    const dto = HistorialMovimientoListadoResponseDto.from(
      movimientoConDetalles([
        linea('3.000000', '0.111111'),
        linea('2.000000', '0.222222'),
      ]),
    );
    expect(dto).toMatchObject({
      almacenOrigen: null,
      almacenDestino: 'Central',
      cantidadDetalles: 2,
      valorCosto: '0.333333',
    });
    expect(dto).not.toHaveProperty('detalles');
  });

  it('deriva el costo unitario de cantidades negativas con redondeo mitad hacia arriba', () => {
    const dto = HistorialMovimientoDetalleResponseDto.from(
      movimientoConDetalles([
        linea('-2.000000', '0.000001'),
        linea('3.000000', '1.000000'),
      ]),
    );
    expect(dto.detalles.map((detalle) => detalle.costoAplicado)).toEqual([
      '0.000001',
      '0.333333',
    ]);
    expect(dto).toMatchObject({
      usuario: 'Operadora',
      compraId: null,
      motivo: 'Conteo',
    });
    expect(dto.detalles[0]).toMatchObject({
      producto: 'Tornillo',
      sku: 'SKU-1',
      unidad: 'unidad',
      costoTotal: '0.000001',
    });
  });

  it('no presenta suma parcial ni convierte un costo desconocido en cero', () => {
    const dto = HistorialMovimientoDetalleResponseDto.from(
      movimientoConDetalles([
        linea('3.000000', '2.000000'),
        linea('2.000000', null),
      ]),
    );
    expect(dto.valorCosto).toBeNull();
    expect(dto.detalles[1].costoTotal).toBeNull();
    expect(dto.detalles[1].costoAplicado).toBeNull();
    expect(
      HistorialMovimientoListadoResponseDto.from(movimientoConDetalles([]))
        .valorCosto,
    ).toBeNull();
  });

  it('resume los cuatro tipos y conserva el vínculo de un ingreso por compra', () => {
    for (const tipo of Object.values(TipoMovimientoInventario)) {
      const movimiento = movimientoConDetalles([linea('2.000000', '0.000000')]);
      movimiento.tipo = tipo;
      expect(
        HistorialMovimientoListadoResponseDto.from(movimiento),
      ).toMatchObject({
        tipo,
        estado: 'confirmado',
        valorCosto: '0.000000',
      });
    }
    const ingreso = movimientoConDetalles([linea('2.000000', '10.000000')]);
    ingreso.tipo = TipoMovimientoInventario.INGRESO;
    ingreso.compra = { id: '550e8400-e29b-41d4-a716-446655440000' } as never;
    expect(HistorialMovimientoDetalleResponseDto.from(ingreso)).toMatchObject({
      tipo: 'ingreso',
      compraId: '550e8400-e29b-41d4-a716-446655440000',
      valorCosto: '10.000000',
      detalles: [{ costoAplicado: '5.000000' }],
    });
  });

  it('suma importes grandes en decimal sin convertirlos a Number', () => {
    const dto = HistorialMovimientoListadoResponseDto.from(
      movimientoConDetalles([
        linea('1.000000', '9007199254740992.123456'),
        linea('1.000000', '0.000001'),
      ]),
    );
    expect(dto.valorCosto).toBe('9007199254740992.123457');
  });
});
