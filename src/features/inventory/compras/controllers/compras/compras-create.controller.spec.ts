import { BadRequestException, Logger } from '@nestjs/common';
import type { CommandBus, QueryBus } from '@nestjs/cqrs';
import type { Request } from 'express';
import { PassThrough } from 'node:stream';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { REQUIRED_PERMISSIONS_KEY } from '../../../../../auth/decorators/require-permissions.decorator.js';
import { PERMISSION_CODES } from '../../../../../shared/authorization/permission-codes.js';
import { AdjuntarComprobanteCommand } from '../../commands/adjuntar-comprobante/adjuntar-comprobante.command.js';
import { CrearCompraCommand } from '../../commands/crear-compra/crear-compra.command.js';
import { ComprasController } from './compras.controller.js';

function formCompra() {
  const form = new FormData();
  form.append('proveedorId', '87f481f1-88c9-4a8c-bcf1-f23edcc52c42');
  form.append('almacenId', '7d2624bb-cc5d-4291-a732-595d39070687');
  form.append('tipoDocumento', 'factura');
  form.append('fecha', '2026-10-17');
  form.append('serieDocumento', 'F001');
  form.append('numeroDocumento', '00001');
  form.append(
    'renglones',
    JSON.stringify([
      {
        varianteId: '3ef90b51-24bf-45da-8a2a-4be5a424e40e',
        unidadId: '3c4b26b7-d0f3-484a-945f-33b66baf855c',
        cantidad: '2',
        precioUnitario: '10.000000',
      },
    ]),
  );
  return form;
}

async function send(controller: ComprasController, form: FormData) {
  const response = new Response(form);
  const stream = new PassThrough();
  const request = stream as unknown as Request;
  request.headers = {
    'content-type': response.headers.get('content-type') ?? '',
  };
  const result = controller.create('user-1', request);
  stream.end(Buffer.from(await response.arrayBuffer()));
  return result;
}

afterEach(() => vi.restoreAllMocks());

describe('POST /api/compras', () => {
  it('confirma la compra sin archivo y responde pendiente', async () => {
    const execute = vi.fn().mockResolvedValue({ id: 'compra-1' });
    const controller = new ComprasController(
      {} as QueryBus,
      { execute } as unknown as CommandBus,
    );
    await expect(send(controller, formCompra())).resolves.toEqual({
      id: 'compra-1',
      comprobante: { estado: 'pendiente' },
    });
    expect(execute).toHaveBeenCalledExactlyOnceWith(
      expect.any(CrearCompraCommand),
    );
  });

  it('confirma la compra y adjunta un comprobante válido sin exponer la clave privada', async () => {
    const execute = vi
      .fn()
      .mockResolvedValueOnce({ id: 'compra-2' })
      .mockResolvedValueOnce({ id: 'file-1' });
    const controller = new ComprasController(
      {} as QueryBus,
      { execute } as unknown as CommandBus,
    );
    const form = formCompra();
    form.append(
      'comprobante',
      new Blob(['%PDF-1.7'], { type: 'application/pdf' }),
      'factura.pdf',
    );

    await expect(send(controller, form)).resolves.toEqual({
      id: 'compra-2',
      comprobante: { estado: 'adjuntado' },
    });
    expect(execute.mock.calls[0][0]).toBeInstanceOf(CrearCompraCommand);
    expect(execute.mock.calls[1][0]).toBeInstanceOf(AdjuntarComprobanteCommand);
  });

  it('confirma la compra y advierte si el comprobante no es válido', async () => {
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const execute = vi.fn().mockResolvedValue({ id: 'compra-3' });
    const controller = new ComprasController(
      {} as QueryBus,
      { execute } as unknown as CommandBus,
    );
    const form = formCompra();
    form.append(
      'comprobante',
      new Blob(['falso'], { type: 'image/png' }),
      'factura.png',
    );

    await expect(send(controller, form)).resolves.toMatchObject({
      id: 'compra-3',
      comprobante: { estado: 'fallido', advertencia: expect.any(String) },
    });
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('no revierte la compra ni reintenta crearla si falla guardar metadatos', async () => {
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const execute = vi
      .fn()
      .mockResolvedValueOnce({ id: 'compra-4' })
      .mockRejectedValueOnce(new Error('almacenamiento'));
    const controller = new ComprasController(
      {} as QueryBus,
      { execute } as unknown as CommandBus,
    );
    const form = formCompra();
    form.append(
      'comprobante',
      new Blob(['%PDF-1.7'], { type: 'application/pdf' }),
      'factura.pdf',
    );

    await expect(send(controller, form)).resolves.toMatchObject({
      id: 'compra-4',
      comprobante: { estado: 'fallido' },
    });
    expect(execute).toHaveBeenCalledTimes(2);
  });

  it('no adjunta ni afirma éxito si falla la transacción de compra', async () => {
    const execute = vi.fn().mockRejectedValue(new Error('transacción'));
    const controller = new ComprasController(
      {} as QueryBus,
      { execute } as unknown as CommandBus,
    );
    const form = formCompra();
    form.append(
      'comprobante',
      new Blob(['%PDF-1.7'], { type: 'application/pdf' }),
      'factura.pdf',
    );

    await expect(send(controller, form)).rejects.toThrow('transacción');
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('rechaza los renglones mal formados y protege la creación con COMPRAS_CREAR', async () => {
    const execute = vi.fn();
    const controller = new ComprasController(
      {} as QueryBus,
      { execute } as unknown as CommandBus,
    );
    const form = formCompra();
    form.set('renglones', 'no-es-json');
    await expect(send(controller, form)).rejects.toThrow(BadRequestException);
    expect(execute).not.toHaveBeenCalled();
    const method = Object.getOwnPropertyDescriptor(
      ComprasController.prototype,
      'create',
    )?.value;
    expect(Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, method)).toEqual([
      PERMISSION_CODES.COMPRAS_CREATE,
    ]);
  });
});
