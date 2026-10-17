import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import {
  MAX_COMPROBANTE_BYTES,
  prepareComprobante,
  type UploadedComprobante,
} from './prepare-comprobante.js';

const pdf: UploadedComprobante = {
  buffer: Buffer.from('%PDF-1.7\ncontenido'),
  mimetype: 'application/pdf',
  originalname: 'factura.pdf',
  size: 18,
};

describe('prepareComprobante', () => {
  it('valida el contenido real y limpia el nombre del archivo', () => {
    expect(
      prepareComprobante({
        ...pdf,
        size: pdf.buffer.length,
        originalname: '../factura.pdf',
      }),
    ).toMatchObject({
      nombreOriginal: 'factura.pdf',
      tipoMime: 'application/pdf',
      extension: 'pdf',
      tamanoBytes: pdf.buffer.length,
    });
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
    expect(
      prepareComprobante({
        buffer: jpeg,
        size: jpeg.length,
        mimetype: 'image/jpeg',
        originalname: 'foto.jpg',
      }).extension,
    ).toBe('jpg');
    const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0]);
    expect(
      prepareComprobante({
        buffer: png,
        size: png.length,
        mimetype: 'image/png',
        originalname: 'foto.png',
      }).extension,
    ).toBe('png');
  });

  it('rechaza MIME falso, tipo inválido y nombre peligroso', () => {
    expect(() =>
      prepareComprobante({
        ...pdf,
        size: pdf.buffer.length,
        mimetype: 'image/png',
      }),
    ).toThrow(BadRequestException);
    expect(() =>
      prepareComprobante({
        ...pdf,
        buffer: Buffer.from('not an image'),
        size: 12,
      }),
    ).toThrow(BadRequestException);
    expect(() =>
      prepareComprobante({
        ...pdf,
        size: pdf.buffer.length,
        originalname: '../',
      }),
    ).toThrow(BadRequestException);
    expect(() =>
      prepareComprobante({
        ...pdf,
        size: pdf.buffer.length,
        originalname: 'factura\n.pdf',
      }),
    ).toThrow(BadRequestException);
  });

  it('rechaza archivos vacíos, mayores de 10 MB o con tamaño inconsistente', () => {
    expect(() => prepareComprobante()).toThrow(BadRequestException);
    expect(() => prepareComprobante({ ...pdf, size: 0 })).toThrow(
      BadRequestException,
    );
    expect(() =>
      prepareComprobante({ ...pdf, size: MAX_COMPROBANTE_BYTES + 1 }),
    ).toThrow(BadRequestException);
    expect(() => prepareComprobante({ ...pdf, size: pdf.size - 1 })).toThrow(
      BadRequestException,
    );
  });
});
