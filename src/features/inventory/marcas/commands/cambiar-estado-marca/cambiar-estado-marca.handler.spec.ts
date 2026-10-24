import { NotFoundException } from '@nestjs/common';
import { CambiarEstadoMarcaCommand } from './cambiar-estado-marca.command.js';
import { CambiarEstadoMarcaHandler } from './cambiar-estado-marca.handler.js';

describe('CambiarEstadoMarcaHandler', () => {
  it('cambia solo el estado sin eliminar marcas ni asociaciones a productos', async () => {
    const marca = {
      id: 'marca-1',
      nombre: 'Bosch',
      activo: false,
      productos: [{ id: 'prod-1' }],
    };
    const repository = {
      update: vi.fn().mockResolvedValue({ affected: 1 }),
      findOneByOrFail: vi.fn().mockResolvedValue(marca),
      delete: vi.fn(),
    };
    const result = await new CambiarEstadoMarcaHandler(
      repository as never,
    ).execute(new CambiarEstadoMarcaCommand('marca-1', false));
    expect(repository.update).toHaveBeenCalledWith(
      { id: 'marca-1' },
      { activo: false },
    );
    expect(repository.delete).not.toHaveBeenCalled();
    expect(result.productos).toEqual([{ id: 'prod-1' }]);
  });

  it('devuelve 404 si la marca no existe', async () => {
    await expect(
      new CambiarEstadoMarcaHandler({
        update: vi.fn().mockResolvedValue({ affected: 0 }),
      } as never).execute(new CambiarEstadoMarcaCommand('marca-1', true)),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
