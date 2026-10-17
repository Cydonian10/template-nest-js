import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ObtenerCompraHandler } from './obtener-compra.handler.js';
import { ObtenerCompraQuery } from './obtener-compra.query.js';

describe('ObtenerCompraHandler', () => {
  it('carga compra, ingreso, renglones y metadatos del comprobante', async () => {
    const compra = { id: 'c1' };
    const repository = { findOne: vi.fn().mockResolvedValue(compra) };
    const handler = new ObtenerCompraHandler(repository as never);

    await expect(handler.execute(new ObtenerCompraQuery('c1'))).resolves.toBe(
      compra,
    );
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { id: 'c1' },
      relations: {
        proveedor: true,
        movimientos: { almacenDestino: true },
        detalles: { variante: { producto: true }, unidad: true },
        comprobantes: true,
      },
    });
  });

  it('informa que la compra no existe', async () => {
    const handler = new ObtenerCompraHandler({
      findOne: vi.fn().mockResolvedValue(null),
    } as never);
    await expect(
      handler.execute(new ObtenerCompraQuery('no-existe')),
    ).rejects.toThrow(NotFoundException);
  });
});
