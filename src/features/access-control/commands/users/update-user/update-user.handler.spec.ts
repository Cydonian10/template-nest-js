import type { EntityManager } from 'typeorm';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import type { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import type { PasswordHasher } from '../../../../../shared/security/password/password-hasher.js';
import type { User } from '../../../entities/user.entity.js';
import { UpdateUserCommand } from './update-user.command.js';
import { UpdateUserHandler } from './update-user.handler.js';

describe('UpdateUserHandler', () => {
  const person = { firstName: 'Ana', active: true };
  const user = {
    id: 'user-id',
    email: 'old@example.com',
    emailNormalized: 'OLD@EXAMPLE.COM',
    emailVerified: true,
    nickName: 'Ana',
    persona: person,
  } as User;
  const findOne = vi.fn();
  const save = vi.fn(async (value: object) => value);
  const manager = { findOne, save } as unknown as EntityManager;
  const unitOfWork = {
    execute: vi.fn((work: (manager: EntityManager) => Promise<User>) =>
      work(manager),
    ),
  } as unknown as UnitOfWork;
  const hash = vi.fn(async () => 'nuevo-hash');
  const handler = new UpdateUserHandler(unitOfWork, {
    hash,
  } as unknown as PasswordHasher);

  beforeEach(() => {
    vi.clearAllMocks();
    findOne.mockResolvedValue({
      id: user.id,
      email: user.email,
      emailNormalized: user.emailNormalized,
      emailVerified: user.emailVerified,
      nickName: user.nickName,
      persona: { ...person },
    });
  });

  it('edita usuario y persona en la misma transacción y guarda solamente el hash', async () => {
    const result = await handler.execute(
      new UpdateUserCommand('user-id', {
        email: 'new@example.com',
        nickName: 'Nueva',
        password: 'clave-segura',
        person: { firstName: 'Nueva' },
      }),
    );
    expect(hash).toHaveBeenCalledWith('clave-segura');
    expect(result).toMatchObject({
      emailNormalized: 'NEW@EXAMPLE.COM',
      nickNameNormalized: 'NUEVA',
      emailVerified: false,
      passwordHash: 'nuevo-hash',
      persona: { firstName: 'Nueva', active: true },
    });
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenNthCalledWith(1, result.persona);
    expect(save).toHaveBeenNthCalledWith(2, result);
  });

  it('conserva el hash y la verificación cuando no cambia el correo normalizado', async () => {
    const result = await handler.execute(
      new UpdateUserCommand('user-id', { email: 'OLD@example.com' }),
    );
    expect(hash).not.toHaveBeenCalled();
    expect(result.emailVerified).toBe(true);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('rechaza usuarios inexistentes', async () => {
    findOne.mockResolvedValue(null);
    await expect(
      handler.execute(new UpdateUserCommand('missing', {})),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(save).not.toHaveBeenCalled();
  });
});
