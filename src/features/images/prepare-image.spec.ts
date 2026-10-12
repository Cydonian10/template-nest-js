import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { prepareImage } from './utils/prepare-image.js';

describe('prepareImage', () => {
  const png = {
    buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0]),
    size: 9,
    mimetype: 'image/png',
    originalname: 'foto.png',
  };

  it('prepara una imagen válida con su extensión', () => {
    expect(prepareImage(png)).toEqual({ ...png, extension: 'png' });
  });

  it('rechaza archivos cuyo contenido no corresponde al MIME', () => {
    expect(() => prepareImage({ ...png, mimetype: 'image/jpeg' })).toThrow(
      BadRequestException,
    );
  });

  it('rechaza imágenes vacías o de más de 5 MB', () => {
    expect(() =>
      prepareImage({ ...png, buffer: Buffer.alloc(0), size: 0 }),
    ).toThrow(BadRequestException);
    const buffer = Buffer.alloc(5 * 1024 * 1024 + 1);
    expect(() => prepareImage({ ...png, buffer, size: buffer.length })).toThrow(
      BadRequestException,
    );
  });
});
