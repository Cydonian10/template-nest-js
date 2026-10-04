import { BadRequestException, ConflictException } from '@nestjs/common';
import type { EntityManager } from 'typeorm';
import type { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { CreateSystemRoleCommand } from './create-system-role.command.js';
import { CreateSystemRoleHandler } from './create-system-role.handler.js';
import { Role } from '../../../entities/roles.entity.js';

describe('CreateSystemRoleHandler', () => {
  const system = { id: 'ventas-id', code: 'VENTAS', active: true };
  const create = vi.fn((_type: object, data: object) => data);
  const save = vi.fn(async (data: object) => data);
  const exists = vi.fn().mockResolvedValue(false);
  const manager = {
    findOneBy: vi.fn().mockResolvedValue(system),
    exists,
    create,
    save,
  } as unknown as EntityManager;
  const unitOfWork = {
    execute: vi.fn((work: (manager: EntityManager) => Promise<unknown>) =>
      work(manager),
    ),
  } as unknown as UnitOfWork;
  const handler = new CreateSystemRoleHandler(unitOfWork);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('crea un rol con código único por sistema y lo vincula antes de devolverlo', async () => {
    const role = await handler.execute(
      new CreateSystemRoleCommand('ventas-id', {
        name: 'Auditor',
        description: 'Lectura',
      }),
    );
    expect(role.code).toBe('VENTAS_AUDITOR');
    expect(role.system).toBe(system);
    expect(create).toHaveBeenCalledWith(
      Role,
      expect.objectContaining({ code: 'VENTAS_AUDITOR', system }),
    );
  });

  it('permite crear el primer rol de un sistema sin permisos previos en él', async () => {
    const role = await handler.execute(
      new CreateSystemRoleCommand('ventas-id', {
        name: 'Primer rol',
        description: 'Lectura',
      }),
    );
    expect(role.system).toBe(system);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('rechaza códigos duplicados o nombres inválidos sin crear asociaciones', async () => {
    exists.mockResolvedValueOnce(true);
    await expect(
      handler.execute(
        new CreateSystemRoleCommand('ventas-id', {
          name: 'Auditor',
          description: 'Lectura',
        }),
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(
      handler.execute(
        new CreateSystemRoleCommand('ventas-id', {
          name: '!!!',
          description: 'Lectura',
        }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(save).not.toHaveBeenCalled();
  });
});
