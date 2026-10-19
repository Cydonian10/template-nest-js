import { describe, expect, it, vi } from 'vitest';
import { BuscarProductosSchema } from '../../dto/buscar-productos.dto.js';
import { BuscarProductosHandler } from './buscar-productos.handler.js';
import { BuscarProductosQuery } from './buscar-productos.query.js';

describe('BuscarProductosHandler', () => {
  it('busca por nombre sin excluir inactivos y pagina con orden estable', async () => {
    const findAndCount = vi.fn().mockResolvedValue([[], 0]);
    const filter = BuscarProductosSchema.parse({
      q: '  Martillo  ',
      page: '2',
    });

    await new BuscarProductosHandler({ findAndCount } as never).execute(
      new BuscarProductosQuery(filter),
    );

    expect(filter).toEqual({ q: 'Martillo', page: 2, limit: 20 });
    expect(findAndCount).toHaveBeenCalledWith({
      where: { nombre: expect.objectContaining({ _value: '%Martillo%' }) },
      order: { nombre: 'ASC', id: 'ASC' },
      skip: 20,
      take: 20,
    });
  });

  it('escapa comodines de SQL y rechaza búsquedas o páginas inválidas', async () => {
    const findAndCount = vi.fn().mockResolvedValue([[], 0]);
    const filter = BuscarProductosSchema.parse({ q: 'A%_\\' });
    await new BuscarProductosHandler({ findAndCount } as never).execute(
      new BuscarProductosQuery(filter),
    );

    expect(findAndCount.mock.calls[0][0].where.nombre._value).toBe(
      '%A\\%\\_\\\\%',
    );
    for (const invalid of [
      {},
      { q: ' x ' },
      { q: 'a'.repeat(201) },
      { q: 'ok', page: 0 },
      { q: 'ok', page: '1.5' },
      { q: 'ok', limit: 21 },
    ]) {
      expect(BuscarProductosSchema.safeParse(invalid).success).toBe(false);
    }
  });
});
