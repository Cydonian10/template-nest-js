import type { Repository } from 'typeorm';
import { Role } from '../../../entities/roles.entity.js';
import { FindAllRolesHandler } from './find-all-roles.handler.js';
import { FindAllRolesQuery } from './find-all-roles.query.js';

describe('FindAllRolesHandler', () => {
  const find = vi.fn().mockResolvedValue([]);
  const handler = new FindAllRolesHandler({ find } as unknown as Repository<Role>);

  beforeEach(() => vi.clearAllMocks());

  it('filtra roles por systemId cuando está definido', async () => {
    await handler.execute(new FindAllRolesQuery('user-id', 'system-id'));
    expect(find).toHaveBeenCalledWith({
      where: { system: { id: 'system-id' } },
    });
  });

  it('consulta todos los roles cuando systemId es undefined', async () => {
    await handler.execute(new FindAllRolesQuery('user-id'));
    expect(find).toHaveBeenCalledWith({ where: {} });
  });
});
