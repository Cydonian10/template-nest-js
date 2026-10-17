import { BadRequestException } from '@nestjs/common';
import { basename } from 'node:path';

export const MAX_COMPROBANTE_BYTES = 10 * 1024 * 1024;

export interface UploadedComprobante {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

export interface PreparedComprobante {
  buffer: Buffer;
  nombreOriginal: string;
  tipoMime: 'application/pdf' | 'image/jpeg' | 'image/png';
  tamanoBytes: number;
  extension: 'pdf' | 'jpg' | 'png';
}

export function prepareComprobante(
  file?: UploadedComprobante,
): PreparedComprobante {
  if (
    !file ||
    !Buffer.isBuffer(file.buffer) ||
    file.size < 1 ||
    file.size > MAX_COMPROBANTE_BYTES
  ) {
    throw new BadRequestException(
      'El comprobante debe tener entre 1 byte y 10 MB',
    );
  }
  if (file.buffer.length !== file.size) {
    throw new BadRequestException('El tamaño del comprobante no coincide');
  }

  let tipoMime: PreparedComprobante['tipoMime'];
  let extension: PreparedComprobante['extension'];
  const bytes = file.buffer;
  if (bytes.subarray(0, 5).equals(Buffer.from('%PDF-'))) {
    tipoMime = 'application/pdf';
    extension = 'pdf';
  } else if (bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) {
    tipoMime = 'image/jpeg';
    extension = 'jpg';
  } else if (
    bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  ) {
    tipoMime = 'image/png';
    extension = 'png';
  } else {
    throw new BadRequestException(
      'El comprobante debe ser un PDF, JPG o PNG real',
    );
  }

  if (file.mimetype !== tipoMime) {
    throw new BadRequestException('El contenido y el tipo MIME no coinciden');
  }
  const nombreOriginal = basename(
    file.originalname.replaceAll('\\', '/'),
  ).trim();
  const tieneCaracteresDeControl = Array.from(nombreOriginal).some(
    (character) => {
      const code = character.charCodeAt(0);
      return code < 32 || code === 127;
    },
  );
  if (
    !nombreOriginal ||
    nombreOriginal === '.' ||
    nombreOriginal === '..' ||
    tieneCaracteresDeControl ||
    nombreOriginal.length > 255
  ) {
    throw new BadRequestException('Nombre de comprobante no válido');
  }

  return {
    buffer: bytes,
    nombreOriginal,
    tipoMime,
    tamanoBytes: file.size,
    extension,
  };
}
