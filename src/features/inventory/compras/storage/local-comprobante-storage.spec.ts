import { NotFoundException } from '@nestjs/common';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LocalComprobanteStorage } from './local-comprobante-storage.js';

describe('LocalComprobanteStorage', () => {
  let directory: string;
  let storage: LocalComprobanteStorage;
  const previousDirectory = process.env.COMPROBANTE_STORAGE_DIR;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'comprobante-test-'));
    process.env.COMPROBANTE_STORAGE_DIR = directory;
    storage = new LocalComprobanteStorage();
  });

  afterEach(async () => {
    if (previousDirectory === undefined) {
      delete process.env.COMPROBANTE_STORAGE_DIR;
    } else {
      process.env.COMPROBANTE_STORAGE_DIR = previousDirectory;
    }
    await rm(directory, { recursive: true, force: true });
  });

  it('escribe, lee y elimina archivos bajo una clave aleatoria privada', async () => {
    const contents = Buffer.from('%PDF-1.7');
    const { key } = await storage.save(contents, 'pdf');
    expect(key).toMatch(/^[0-9a-f-]{36}\.pdf$/);
    expect(await storage.read(key)).toEqual(contents);
    await storage.delete(key);
    await storage.delete(key);
    await expect(storage.read(key)).rejects.toThrow(NotFoundException);
  });

  it('rechaza claves ajenas a su directorio y extensiones no permitidas', async () => {
    await expect(storage.read('../archivo.pdf')).rejects.toThrow(
      NotFoundException,
    );
    await expect(storage.delete('../archivo.pdf')).rejects.toThrow(
      NotFoundException,
    );
    await expect(storage.save(Buffer.from('x'), 'html')).rejects.toThrow();
  });
});
