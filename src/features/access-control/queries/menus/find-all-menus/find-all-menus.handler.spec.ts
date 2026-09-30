import type { Repository } from 'typeorm';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { Menu } from '../../../entities/menu.entity.js';
import { SystemModule } from '../../../entities/module.entity.js';
import { Role } from '../../../entities/roles.entity.js';
import { FindAllMenusHandler } from './find-all-menus.handler.js';
import { FindAllMenusQuery } from './find-all-menus.query.js';

describe('FindAllMenusHandler', () => {
  const menus = [{ id: 'menu-id', name: 'Inicio', active: false }] as Menu[];
  const find = vi.fn().mockResolvedValue(menus);
  const moduleExists = vi.fn().mockResolvedValue(true);
  const roleExists = vi.fn().mockResolvedValue(true);
  const getMany = vi.fn().mockResolvedValue(menus);
  const builder = {
    innerJoin: vi.fn().mockReturnThis(),
    andWhere: vi.fn().mockReturnThis(),
    distinct: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    addOrderBy: vi.fn().mockReturnThis(),
    getMany,
  };
  const createQueryBuilder = vi.fn().mockReturnValue(builder);
  const handler = new FindAllMenusHandler(
    { find, createQueryBuilder } as unknown as Repository<Menu>,
    { existsBy: moduleExists } as unknown as Repository<SystemModule>,
    { existsBy: roleExists } as unknown as Repository<Role>,
  );

  beforeEach(() => {
    vi.clearAllMocks();
    moduleExists.mockResolvedValue(true);
    roleExists.mockResolvedValue(true);
  });

  it('lista todos los menús incluidos los inactivos sin filtros', async () => {
    await expect(handler.execute(new FindAllMenusQuery())).resolves.toBe(menus);
    expect(find).toHaveBeenCalledWith({ order: { name: 'ASC', id: 'ASC' } });
    expect(createQueryBuilder).not.toHaveBeenCalled();
  });

  it('combina moduleId y roleId y evita duplicados', async () => {
    await expect(
      handler.execute(new FindAllMenusQuery('module-id', 'role-id')),
    ).resolves.toBe(menus);
    expect(builder.innerJoin).toHaveBeenCalledWith(
      'menu.roleMenus',
      'assignment',
    );
    expect(builder.andWhere).toHaveBeenCalledWith(
      'assignment.role_id = :roleId',
      { roleId: 'role-id' },
    );
    expect(builder.andWhere).toHaveBeenCalledWith(
      'menu.module_id = :moduleId',
      { moduleId: 'module-id' },
    );
    expect(builder.distinct).toHaveBeenCalledWith(true);
  });

  it('filtra por módulo sin necesidad de rol', async () => {
    await handler.execute(new FindAllMenusQuery('module-id'));
    expect(builder.innerJoin).not.toHaveBeenCalled();
    expect(builder.andWhere).toHaveBeenCalledWith(
      'menu.module_id = :moduleId',
      { moduleId: 'module-id' },
    );
  });

  it('devuelve 404 para un módulo o rol inexistente', async () => {
    moduleExists.mockResolvedValue(false);
    await expect(
      handler.execute(new FindAllMenusQuery('missing-module')),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    roleExists.mockResolvedValue(false);
    await expect(
      handler.execute(new FindAllMenusQuery(undefined, 'missing-role')),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(createQueryBuilder).not.toHaveBeenCalled();
  });
});
