import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import type { Repository } from 'typeorm';
import { Almacen } from '../../../entities/almacen.entity.js';
import { MinimoExistencia } from '../../../entities/minimo-existencia.entity.js';
import { VarianteProducto } from '../../../entities/variante-producto.entity.js';
import { ValidarParMinimo } from '../validar-par-minimo.js';
import { QuitarMinimoCommand } from '../quitar-minimo/quitar-minimo.command.js';
import { QuitarMinimoHandler } from '../quitar-minimo/quitar-minimo.handler.js';
import { GuardarMinimoCommand } from './guardar-minimo.command.js';
import { GuardarMinimoHandler } from './guardar-minimo.handler.js';

describe('comandos de mínimos', () => {
  const findOne = vi.fn();
  const findOneBy = vi.fn();
  const upsert = vi.fn();
  const deleteMinimo = vi.fn();
  const validar = new ValidarParMinimo(
    { findOne } as unknown as Repository<VarianteProducto>,
    { findOneBy } as unknown as Repository<Almacen>,
  );
  const minimos = {
    upsert,
    delete: deleteMinimo,
  } as unknown as Repository<MinimoExistencia>;
  const guardar = new GuardarMinimoHandler(minimos, validar);
  const quitar = new QuitarMinimoHandler(minimos, validar);

  beforeEach(() => {
    vi.clearAllMocks();
    findOne.mockResolvedValue({ id: 'v1', activo: true });
    findOneBy.mockResolvedValue({ id: 'a1', activo: true });
    upsert.mockResolvedValue(undefined);
    deleteMinimo.mockResolvedValue({ affected: 0 });
  });

  it('crea o sustituye el mínimo sin consultar ni crear una fila de existencia', async () => {
    await guardar.execute(new GuardarMinimoCommand('v1', 'a1', '3.000000'));
    expect(findOne).toHaveBeenCalledWith({
      where: { id: 'v1', activo: true, producto: { activo: true } },
    });
    expect(findOneBy).toHaveBeenCalledWith({ id: 'a1', activo: true });
    expect(upsert).toHaveBeenCalledWith(
      { varianteId: 'v1', almacenId: 'a1', minimoBase: '3.000000' },
      ['varianteId', 'almacenId'],
    );
  });

  it('permite repetir el borrado aunque nunca existiera un mínimo', async () => {
    await quitar.execute(new QuitarMinimoCommand('v1', 'a1'));
    await quitar.execute(new QuitarMinimoCommand('v1', 'a1'));
    expect(deleteMinimo).toHaveBeenCalledTimes(2);
    expect(deleteMinimo).toHaveBeenCalledWith({ varianteId: 'v1', almacenId: 'a1' });
  });

  it('rechaza variante o almacén inexistente o inactivo', async () => {
    findOne.mockResolvedValueOnce(null);
    await expect(
      guardar.execute(new GuardarMinimoCommand('v1', 'a1', '1')),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(upsert).not.toHaveBeenCalled();

    findOneBy.mockResolvedValueOnce(null);
    await expect(
      quitar.execute(new QuitarMinimoCommand('v1', 'a1')),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(deleteMinimo).not.toHaveBeenCalled();
  });
});
