import { describe, expect, it, vi } from 'vitest';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { ObtenerHistorialMovimientoHandler } from './obtener-historial-movimiento.handler.js';
import { ObtenerHistorialMovimientoQuery } from './obtener-historial-movimiento.query.js';

const id = 'f43749e9-2ff3-42c0-8370-7cc714045165';

describe('ObtenerHistorialMovimientoHandler', () => {
  it('carga un confirmado y todas las relaciones necesarias en una consulta', async () => {
    const movimiento = { id, tipo: 'ingreso', compra: { id: 'compra-1' } };
    const repository = { findOne: vi.fn().mockResolvedValue(movimiento) };
    const resultado = await new ObtenerHistorialMovimientoHandler(repository as never).execute(
      new ObtenerHistorialMovimientoQuery(id),
    );

    expect(resultado).toBe(movimiento);
    expect(repository.findOne).toHaveBeenCalledExactlyOnceWith({
      where: { id, estado: 'confirmado' },
      relations: {
        usuario: true,
        compra: true,
        almacenOrigen: true,
        almacenDestino: true,
        detalles: { variante: { producto: true }, unidad: true },
      },
      order: { detalles: { id: 'ASC' } },
    });
  });

  it('devuelve 404 para un movimiento inexistente o no confirmado', async () => {
    const repository = { findOne: vi.fn().mockResolvedValue(null) };
    const handler = new ObtenerHistorialMovimientoHandler(repository as never);
    await expect(handler.execute(new ObtenerHistorialMovimientoQuery(id))).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
    expect(repository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id, estado: 'confirmado' } }),
    );
  });
});
