import { BadRequestException } from '@nestjs/common';
import { PassThrough } from 'node:stream';
import type { Request } from 'express';
import { describe, expect, it } from 'vitest';
import { MAX_COMPROBANTE_BYTES } from '../prepare-comprobante.js';
import { parseCompraMultipart } from './parse-compra-multipart.js';

async function parse(form: FormData) {
  const response = new Response(form);
  const stream = new PassThrough();
  const request = stream as unknown as Request;
  request.headers = {
    'content-type': response.headers.get('content-type') ?? '',
  };
  const result = parseCompraMultipart(request);
  stream.end(Buffer.from(await response.arrayBuffer()));
  return result;
}

describe('parseCompraMultipart', () => {
  it('procesa campos aunque el archivo aparezca primero en el envío', async () => {
    const form = new FormData();
    form.append(
      'comprobante',
      new Blob(['%PDF-1.7'], { type: 'application/pdf' }),
      'factura.pdf',
    );
    form.append('proveedorId', 'proveedor-1');
    form.append('renglones', '[{"cantidad":"2"}]');

    const result = await parse(form);
    expect(result.fields).toEqual({
      proveedorId: 'proveedor-1',
      renglones: '[{"cantidad":"2"}]',
    });
    expect(result.file).toMatchObject({
      originalname: 'factura.pdf',
      mimetype: 'application/pdf',
      size: 8,
    });
    expect(result.advertencia).toBeUndefined();
  });

  it('descarta un archivo mayor de 10 MB y conserva los campos posteriores', async () => {
    const form = new FormData();
    form.append(
      'comprobante',
      new Blob([Buffer.alloc(MAX_COMPROBANTE_BYTES + 1)], {
        type: 'image/png',
      }),
      'foto.png',
    );
    form.append('proveedorId', 'proveedor-1');

    const result = await parse(form);
    expect(result.fields).toEqual({ proveedorId: 'proveedor-1' });
    expect(result.file).toBeUndefined();
    expect(result.advertencia).toContain('10 MB');
  });

  it('rechaza demasiados campos de compra, pero no exige archivo', async () => {
    const form = new FormData();
    form.append('proveedorId', 'proveedor-1');
    await expect(parse(form)).resolves.toMatchObject({
      fields: { proveedorId: 'proveedor-1' },
    });

    for (let index = 0; index < 9; index++) form.append(`extra${index}`, 'x');
    await expect(parse(form)).rejects.toThrow(BadRequestException);
  });

  it('advierte si se intentan adjuntar varios archivos sin perder los campos', async () => {
    const form = new FormData();
    form.append(
      'comprobante',
      new Blob(['%PDF-1.7'], { type: 'application/pdf' }),
      'uno.pdf',
    );
    form.append(
      'comprobante',
      new Blob(['%PDF-1.7'], { type: 'application/pdf' }),
      'dos.pdf',
    );
    form.append('proveedorId', 'proveedor-1');
    const result = await parse(form);
    expect(result.fields.proveedorId).toBe('proveedor-1');
    expect(result.file).toBeUndefined();
    expect(result.advertencia).toContain('Solo se permite');
  });
});
