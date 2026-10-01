import type { Repository } from 'typeorm';
import { ResourceNotFoundException } from '../../../../shared/exceptions/resource-not-found.exception.js';
import { SystemModule } from '../../entities/module.entity.js';
import { System } from '../../entities/system.entity.js';
import { FindSystemModulesHandler } from './find-system-modules.handler.js';
import { FindSystemModulesQuery } from './find-system-modules.query.js';

describe('FindSystemModulesHandler', () => {
  const existsBy = vi.fn();
  const find = vi.fn();
  const handler = new FindSystemModulesHandler(
    { find } as unknown as Repository<SystemModule>,
    { existsBy } as unknown as Repository<System>,
  );

  beforeEach(() => {
    vi.clearAllMocks();
    existsBy.mockResolvedValue(true);
    find.mockResolvedValue([]);
  });

  it('lista los módulos ordenados de un sistema', async () => {
    await expect(
      handler.execute(new FindSystemModulesQuery('system-id')),
    ).resolves.toEqual([]);
    expect(find).toHaveBeenCalledWith({
      where: { system: { id: 'system-id' } },
      order: { order: 'ASC', name: 'ASC', id: 'ASC' },
    });
  });

  it('responde 404 si el sistema no existe', async () => {
    existsBy.mockResolvedValue(false);
    await expect(
      handler.execute(new FindSystemModulesQuery('missing')),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(find).not.toHaveBeenCalled();
  });
});
