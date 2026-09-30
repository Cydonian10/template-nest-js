import { ConflictException } from '@nestjs/common';
import type { EntityManager } from 'typeorm';
import type { UnitOfWork } from '../../../../shared/database/unit-of-work.js';
import { ResourceNotFoundException } from '../../../../shared/exceptions/resource-not-found.exception.js';
import type { User } from '../../entities/user.entity.js';
import { Role } from '../../entities/roles.entity.js';
import { BlockUserCommand } from './block-user/block-user.command.js';
import { BlockUserHandler } from './block-user/block-user.handler.js';
import { ActivateUserCommand } from './activate-user/activate-user.command.js';
import { ActivateUserHandler } from './activate-user/activate-user.handler.js';
import { BlockPersonCommand } from './block-person/block-person.command.js';
import { BlockPersonHandler } from './block-person/block-person.handler.js';
import { ActivatePersonCommand } from './activate-person/activate-person.command.js';
import { ActivatePersonHandler } from './activate-person/activate-person.handler.js';

describe('User and person status handlers', () => {
  const findOne = vi.fn();
  const save = vi.fn(async (value: object) => value);
  const query = {
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    andWhere: vi.fn().mockReturnThis(),
    clone: vi.fn(),
    getCount: vi.fn(),
    select: vi.fn().mockReturnThis(),
    getRawOne: vi.fn(),
  };
  query.clone.mockReturnValue(query);
  const manager = {
    findOne,
    save,
    createQueryBuilder: vi.fn(() => query),
  } as unknown as EntityManager;
  const unitOfWork = {
    execute: vi.fn((work: (manager: EntityManager) => Promise<User>) =>
      work(manager),
    ),
  } as unknown as UnitOfWork;

  beforeEach(() => {
    vi.clearAllMocks();
    findOne.mockImplementation(async (entity: { name: string }) =>
      entity.name === 'Role'
        ? { id: 'role-id' }
        : { id: 'user-id', active: true, persona: { active: true } },
    );
    query.getCount.mockResolvedValue(1);
    query.getRawOne.mockResolvedValue({ count: '2' });
  });

  it('bloquea solo al usuario y permite repetir la operación', async () => {
    const handler = new BlockUserHandler(unitOfWork);
    const result = await handler.execute(new BlockUserCommand('user-id'));
    expect(result.active).toBe(false);
    expect(result.persona.active).toBe(true);
    expect(save).toHaveBeenCalledTimes(1);
    findOne.mockResolvedValueOnce({
      id: 'user-id',
      active: false,
      persona: { active: true },
    });
    await handler.execute(new BlockUserCommand('user-id'));
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('impide bloquear al último SuperAdmin vigente', async () => {
    query.getRawOne.mockResolvedValue({ count: '1' });
    await expect(
      new BlockUserHandler(unitOfWork).execute(new BlockUserCommand('user-id')),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(save).not.toHaveBeenCalled();
    expect(findOne).toHaveBeenCalledWith(Role, {
      where: { code: 'SUPER_ADMIN' },
      lock: { mode: 'pessimistic_write' },
    });
    expect(query.select).toHaveBeenCalledWith(
      'COUNT(DISTINCT user.id)',
      'count',
    );
  });

  it('permite bloquear a alguien sin rol SuperAdmin aunque solo exista un administrador', async () => {
    query.getCount.mockResolvedValue(0);
    query.getRawOne.mockResolvedValue({ count: '1' });
    await expect(
      new BlockUserHandler(unitOfWork).execute(new BlockUserCommand('user-id')),
    ).resolves.toMatchObject({ active: false });
  });

  it('bloquea solo a la persona y protege al último SuperAdmin', async () => {
    const handler = new BlockPersonHandler(unitOfWork);
    const result = await handler.execute(new BlockPersonCommand('user-id'));
    expect(result.active).toBe(true);
    expect(result.persona.active).toBe(false);
    expect(save).toHaveBeenCalledWith(result.persona);
    query.getRawOne.mockResolvedValue({ count: '1' });
    await expect(
      handler.execute(new BlockPersonCommand('user-id')),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('activa independientemente usuario y persona', async () => {
    findOne.mockResolvedValue({
      id: 'user-id',
      active: false,
      persona: { active: false },
    });
    const user = await new ActivateUserHandler(unitOfWork).execute(
      new ActivateUserCommand('user-id'),
    );
    expect(user.active).toBe(true);
    expect(user.persona.active).toBe(false);
    const result = await new ActivatePersonHandler(unitOfWork).execute(
      new ActivatePersonCommand('user-id'),
    );
    expect(result.persona.active).toBe(true);
    expect(save).toHaveBeenCalledTimes(2);
  });

  it('devuelve 404 si no existe el usuario', async () => {
    findOne.mockResolvedValue(null);
    await expect(
      new BlockPersonHandler(unitOfWork).execute(
        new BlockPersonCommand('missing'),
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });
});
