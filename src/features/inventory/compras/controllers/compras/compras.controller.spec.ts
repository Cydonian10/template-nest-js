import type { CommandBus, QueryBus } from '@nestjs/cqrs';
import { describe, expect, it, vi } from 'vitest';
import { REQUIRED_PERMISSIONS_KEY } from '../../../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../../../shared/authorization/permission-codes.js';
import { ListarComprasQuery } from '../../queries/listar-compras/listar-compras.query.js';
import { ObtenerCompraQuery } from '../../queries/obtener-compra/obtener-compra.query.js';
import { ComprasController } from './compras.controller.js';
import { EditarCompraCommand } from '../../commands/editar-compra/editar-compra.command.js';

const compra = {
  id: 'c1',
  revision: 0,
  fecha: '2026-10-17',
  fechaRegistro: new Date('2026-10-17T10:00:00Z'),
  tipoDocumento: 'factura',
  serieDocumento: 'F001',
  numeroDocumento: '123',
  totalDocumento: '120.000000',
  observaciones: 'Entrega completa',
  proveedor: { id: 'p1', nombre: 'Proveedor Uno' },
  movimientos: [
    {
      id: 'm1',
      tipo: 'ingreso',
      estado: 'confirmado',
      fecha: new Date('2026-10-17T10:00:01Z'),
      almacenDestino: { id: 'a1', nombre: 'Principal' },
    },
  ],
  detalles: [
    {
      id: 'd1',
      variante: { id: 'v1', sku: 'CAM-NEG', producto: { nombre: 'Camiseta' } },
      unidad: { id: 'u1', nombre: 'Caja', simbolo: 'cj' },
      cantidad: '2.000000',
      factorABase: '12.00000000',
      precioUnitario: '60.000000',
    },
  ],
  comprobantes: [
    {
      id: 'f1',
      nombreOriginal: 'factura.pdf',
      tipoMime: 'application/pdf',
      tamanoBytes: 1024,
      fechaSubida: new Date('2026-10-17T10:00:02Z'),
      claveAlmacenamiento: 'clave-privada.pdf',
    },
  ],
};

describe('ComprasController', () => {
  it('devuelve lista paginada sin exponer claves privadas', async () => {
    const execute = vi.fn().mockResolvedValue([[compra], 1]);
    const controller = new ComprasController(
      { execute } as unknown as QueryBus,
      { execute: vi.fn() } as unknown as CommandBus,
    );
    const filter = { page: 1, limit: 20, q: 'F001' };

    const response = await controller.list(filter);

    expect(execute).toHaveBeenCalledWith(new ListarComprasQuery(filter));
    expect(response).toMatchObject({
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      data: [
        {
          id: 'c1',
          almacen: { id: 'a1', nombre: 'Principal' },
          cantidadRenglones: 1,
          totalDocumento: '120.000000',
        },
      ],
    });
    expect(JSON.stringify(response)).not.toContain('clave-privada');
  });

  it('devuelve detalle con ingreso y metadatos del archivo, sin clave de almacenamiento', async () => {
    const execute = vi.fn().mockResolvedValue(compra);
    const controller = new ComprasController(
      { execute } as unknown as QueryBus,
      { execute: vi.fn() } as unknown as CommandBus,
    );

    const response = await controller.getById('c1');

    expect(execute).toHaveBeenCalledWith(new ObtenerCompraQuery('c1'));
    expect(response).toMatchObject({
      ingreso: { id: 'm1', estado: 'confirmado' },
      renglones: [
        {
          varianteId: 'v1',
          sku: 'CAM-NEG',
          productoNombre: 'Camiseta',
          unidadSimbolo: 'cj',
          cantidad: '2.000000',
        },
      ],
      comprobante: { id: 'f1', nombreOriginal: 'factura.pdf' },
    });
    expect(JSON.stringify(response)).not.toContain('clave-privada');
  });

  it('responde vacío y tolera compras antiguas sin recepción o comprobante', async () => {
    const execute = vi
      .fn()
      .mockResolvedValueOnce([[], 0])
      .mockResolvedValueOnce({
        ...compra,
        movimientos: [],
        detalles: [],
        comprobantes: [],
      });
    const controller = new ComprasController(
      { execute } as unknown as QueryBus,
      { execute: vi.fn() } as unknown as CommandBus,
    );
    expect(await controller.list({ page: 1, limit: 20 })).toEqual({
      data: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });
    await expect(controller.getById('c1')).resolves.toMatchObject({
      almacen: null,
      ingreso: null,
      renglones: [],
      comprobante: null,
    });
  });

  it('protege listado y detalle con COMPRAS_LEER', () => {
    for (const name of ['list', 'getById'] as const) {
      const method = Object.getOwnPropertyDescriptor(
        ComprasController.prototype,
        name,
      )?.value;
      expect(Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, method)).toEqual([
        PERMISSION_CODES.COMPRAS_READ,
      ]);
    }
  });

  it('protege la corrección con COMPRAS_EDITAR y no acepta montos enviados por el cliente', async () => {
    const queries = {
      execute: vi.fn().mockResolvedValue({ ...compra, revision: 1 }),
    };
    const commands = { execute: vi.fn() };
    const controller = new ComprasController(
      queries as unknown as QueryBus,
      commands as unknown as CommandBus,
    );
    const body = {
      revision: 0,
      tipoDocumento: 'factura',
      fecha: '2026-10-17',
      serieDocumento: 'F001',
      numeroDocumento: '123',
      observaciones: '',
      precios: [
        {
          renglonId: '388f7d3d-e46b-427f-aeef-51f870809031',
          precioUnitario: '12.00',
        },
      ],
    };
    const method = Object.getOwnPropertyDescriptor(
      ComprasController.prototype,
      'update',
    )?.value;
    expect(Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, method)).toEqual([
      PERMISSION_CODES.COMPRAS_UPDATE,
    ]);
    expect(await controller.update('c1', 'usuario', body)).toMatchObject({
      id: 'c1',
      revision: 1,
    });
    expect(commands.execute).toHaveBeenCalledWith(
      new EditarCompraCommand('c1', 'usuario', body),
    );
    await expect(
      controller.update('c1', 'usuario', { ...body, totalDocumento: '0' }),
    ).rejects.toThrow();
    expect(commands.execute).toHaveBeenCalledTimes(1);
  });
});
