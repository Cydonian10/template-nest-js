import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import {
  ComprobanteStorage,
  type StoredComprobante,
} from './comprobante-storage.js';

@Injectable()
export class LocalComprobanteStorage extends ComprobanteStorage {
  private readonly directory = resolve(
    process.env.COMPROBANTE_STORAGE_DIR ?? 'uploads/comprobantes',
  );

  async save(buffer: Buffer, extension: string): Promise<StoredComprobante> {
    if (!['pdf', 'jpg', 'png'].includes(extension)) {
      throw new NotFoundException('Tipo de comprobante no admitido');
    }
    await mkdir(this.directory, { recursive: true });
    const key = `${randomUUID()}.${extension}`;
    await writeFile(join(this.directory, key), buffer, { flag: 'wx' });
    return { key };
  }

  async read(key: string): Promise<Buffer> {
    try {
      return await readFile(this.path(key));
    } catch (error) {
      if (this.isMissing(error)) {
        throw new NotFoundException('Comprobante no encontrado');
      }
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await unlink(this.path(key));
    } catch (error) {
      if (!this.isMissing(error)) throw error;
    }
  }

  private path(key: string): string {
    if (
      !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}\.(pdf|jpg|png)$/.test(key)
    ) {
      throw new NotFoundException('Comprobante no encontrado');
    }
    return join(this.directory, key);
  }

  private isMissing(error: unknown): boolean {
    return error instanceof Error && 'code' in error && error.code === 'ENOENT';
  }
}
