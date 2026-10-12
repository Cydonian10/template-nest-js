import { BadRequestException } from '@nestjs/common';
import type { UploadedImage } from '../images.service.js';

export interface PreparedImage extends UploadedImage {
  extension: 'jpg' | 'png' | 'webp';
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export function prepareImage(file: UploadedImage): PreparedImage {
  if (
    !file ||
    !Buffer.isBuffer(file.buffer) ||
    file.buffer.length === 0 ||
    file.size !== file.buffer.length ||
    file.size > MAX_IMAGE_SIZE
  ) {
    throw new BadRequestException(
      'Cada imagen debe pesar como máximo 5 MB y contener datos válidos',
    );
  }

  const bytes = file.buffer;
  if (
    file.mimetype === 'image/jpeg' &&
    bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))
  ) {
    return { ...file, extension: 'jpg' };
  }
  if (
    file.mimetype === 'image/png' &&
    bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  ) {
    return { ...file, extension: 'png' };
  }
  if (
    file.mimetype === 'image/webp' &&
    bytes.toString('ascii', 0, 4) === 'RIFF' &&
    bytes.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return { ...file, extension: 'webp' };
  }

  throw new BadRequestException(
    'Solo se permiten imágenes JPEG, PNG o WebP válidas',
  );
}
