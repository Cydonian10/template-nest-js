import { NotFoundException } from '@nestjs/common';
import { CambiarEstadoCategoriaCommand } from './cambiar-estado-categoria.command.js';
import { CambiarEstadoCategoriaHandler } from './cambiar-estado-categoria.handler.js';

describe('CambiarEstadoCategoriaHandler', () => {
  it('cambia solo el estado y conserva las asociaciones a productos', async () => {
    const existing = {
      id: 'id-1',
      activo: false,
      productos: [{ id: 'prod-1' }],
    };
    const repository = {
      update: vi.fn().mockResolvedValue({ affected: 1 }),
      findOneByOrFail: vi.fn().mockResolvedValue(existing),
      delete: vi.fn(),
    };
    const result = await new CambiarEstadoCategoriaHandler(
      repository as never,
    ).execute(new CambiarEstadoCategoriaCommand('id-1', false));
    expect(repository.update).toHaveBeenCalledWith(
      { id: 'id-1' },
      { activo: false },
    );
    expect(repository.delete).not.toHaveBeenCalled();
    expect(result.productos).toEqual([{ id: 'prod-1' }]);
  });

  it('devuelve 404 al cambiar el estado de una categoría inexistente', async () => {
    await expect(
      new CambiarEstadoCategoriaHandler({
        update: vi.fn().mockResolvedValue({ affected: 0 }),
      } as never).execute(new CambiarEstadoCategoriaCommand('id-1', false)),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
