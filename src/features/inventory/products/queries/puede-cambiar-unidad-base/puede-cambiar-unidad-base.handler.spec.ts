import { describe, expect, it, vi } from 'vitest';
import type { EntityManager } from 'typeorm';
import { DetalleMovimiento } from '../../../entities/detalle-movimiento.entity.js';
import { Existencia } from '../../../entities/existencia.entity.js';
import { PuedeCambiarUnidadBaseHandler } from './puede-cambiar-unidad-base.handler.js';
import { PuedeCambiarUnidadBaseQuery } from './puede-cambiar-unidad-base.query.js';

describe('PuedeCambiarUnidadBaseHandler', () => {
  it('rechaza con movimientos históricos aunque ya no quede saldo', async () => {
    const exists = vi.fn().mockResolvedValue(true);
    const handler = new PuedeCambiarUnidadBaseHandler({
      exists,
    } as unknown as EntityManager);

    await expect(
      handler.execute(new PuedeCambiarUnidadBaseQuery('p1')),
    ).resolves.toBe(false);
    expect(exists).toHaveBeenCalledWith(DetalleMovimiento, {
      where: { variante: { producto: { id: 'p1' } } },
    });
    expect(exists).toHaveBeenCalledTimes(1);
  });

  it('rechaza con saldo sin filtrar almacenes activos', async () => {
    const exists = vi
      .fn()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    const handler = new PuedeCambiarUnidadBaseHandler({
      exists,
    } as unknown as EntityManager);

    await expect(
      handler.execute(new PuedeCambiarUnidadBaseQuery('p1')),
    ).resolves.toBe(false);
    expect(exists).toHaveBeenCalledWith(Existencia, {
      where: {
        variante: { producto: { id: 'p1' } },
        cantidad: expect.objectContaining({ _type: 'not', _value: '0' }),
      },
    });
  });

  it('permite cambiar cuando no hay historial ni saldos', async () => {
    const exists = vi.fn().mockResolvedValue(false);
    const handler = new PuedeCambiarUnidadBaseHandler({
      exists,
    } as unknown as EntityManager);

    await expect(
      handler.execute(new PuedeCambiarUnidadBaseQuery('p1')),
    ).resolves.toBe(true);
    expect(exists).toHaveBeenCalledTimes(2);
  });
});
