import { BadRequestException } from '@nestjs/common';
import busboy from 'busboy';
import type { Request } from 'express';
import {
  MAX_COMPROBANTE_BYTES,
  type UploadedComprobante,
} from '../prepare-comprobante.js';

export interface CompraMultipart {
  fields: Record<string, string>;
  file?: UploadedComprobante;
  advertencia?: string;
}

export function parseCompraMultipart(
  request: Request,
): Promise<CompraMultipart> {
  if (!request.headers['content-type']?.startsWith('multipart/form-data;')) {
    throw new BadRequestException('La compra requiere multipart/form-data');
  }

  return new Promise((resolve, reject) => {
    let parser: ReturnType<typeof busboy>;
    try {
      parser = busboy({
        headers: request.headers,
        limits: {
          fileSize: MAX_COMPROBANTE_BYTES,
          fieldSize: 256 * 1024,
          files: 1,
          fields: 8,
          parts: 16,
          fieldNameSize: 100,
        },
      });
    } catch {
      reject(new BadRequestException('Solicitud multipart inválida'));
      return;
    }

    const result: CompraMultipart = {
      fields: Object.create(null) as Record<string, string>,
    };
    let tooManyFields = false;
    parser.on('field', (name, value, info) => {
      if (info.nameTruncated || info.valueTruncated) tooManyFields = true;
      result.fields[name] = value;
    });
    parser.on('file', (name, stream, info) => {
      const chunks: Buffer[] = [];
      let size = 0;
      if (name !== 'comprobante') {
        result.advertencia = 'El campo del comprobante no es válido';
        stream.resume();
        return;
      }
      stream.on('data', (chunk: Buffer) => {
        size += chunk.length;
        chunks.push(chunk);
      });
      stream.on('end', () => {
        if (stream.truncated) {
          result.advertencia = 'El comprobante supera el límite de 10 MB';
        } else if (!result.advertencia) {
          result.file = {
            buffer: Buffer.concat(chunks),
            size,
            mimetype: info.mimeType,
            originalname: info.filename,
          };
        }
      });
    });
    parser.on('filesLimit', () => {
      result.advertencia = 'Solo se permite un comprobante';
      result.file = undefined;
    });
    parser.on('fieldsLimit', () => {
      tooManyFields = true;
    });
    parser.on('partsLimit', () => {
      tooManyFields = true;
    });
    parser.on('error', () =>
      reject(new BadRequestException('Solicitud multipart inválida')),
    );
    parser.on('close', () => {
      if (tooManyFields)
        reject(new BadRequestException('Demasiados campos en la compra'));
      else resolve(result);
    });
    request.on('aborted', () =>
      reject(new BadRequestException('Solicitud interrumpida')),
    );
    request.on('error', () =>
      reject(new BadRequestException('Solicitud interrumpida')),
    );
    request.pipe(parser);
  });
}
