import type { Repository } from 'typeorm';
import { ResourceNotFoundException } from '../../../../shared/exceptions/resource-not-found.exception.js';
import { SystemModule } from '../../entities/module.entity.js';
import { FindSystemModuleHandler } from './find-system-module.handler.js';
import { FindSystemModuleQuery } from './find-system-module.query.js';

describe('FindSystemModuleHandler', () => {
  const findOneBy = vi.fn();
  const handler = new FindSystemModuleHandler({
    findOneBy,
  } as unknown as Repository<SystemModule>);

  it('busca el módulo dentro del sistema indicado', async () => {
    const module = { id: 'module-id' } as SystemModule;
    findOneBy.mockResolvedValueOnce(module);
    await expect(
      handler.execute(new FindSystemModuleQuery('system-id', module.id)),
    ).resolves.toBe(module);
    expect(findOneBy).toHaveBeenCalledWith({
      id: module.id,
      system: { id: 'system-id' },
    });
  });

  it('no devuelve módulos de otro sistema', async () => {
    findOneBy.mockResolvedValueOnce(null);
    await expect(
      handler.execute(new FindSystemModuleQuery('other-system', 'module-id')),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });
});
