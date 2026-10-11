import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { ImageStorage, type StoredImage } from './image-storage.js';

@Injectable()
export class LocalImageStorage extends ImageStorage {
  private readonly directory = resolve(
    process.env.IMAGE_STORAGE_DIR ?? 'uploads/images',
  );

  async save(buffer: Buffer, extension: string): Promise<StoredImage> {
    await mkdir(this.directory, { recursive: true });
    const key = `${randomUUID()}.${extension}`;
    await writeFile(join(this.directory, key), buffer, { flag: 'wx' });
    return { key, provider: 'local' };
  }

  async read(key: string): Promise<Buffer> {
    try {
      return await readFile(this.path(key));
    } catch (error) {
      if (this.isMissing(error))
        throw new NotFoundException('Archivo no encontrado');
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
    if (!/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(key)) {
      throw new NotFoundException('Archivo no encontrado');
    }
    return join(this.directory, key);
  }

  private isMissing(error: unknown): boolean {
    return error instanceof Error && 'code' in error && error.code === 'ENOENT';
  }
}
