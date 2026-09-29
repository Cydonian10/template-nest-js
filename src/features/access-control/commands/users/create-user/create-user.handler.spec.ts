import type { EntityManager } from 'typeorm';
import { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { Person } from '../../../entities/person.entity.js';
import { User } from '../../../entities/user.entity.js';
import { CreateUserCommand } from './create-user.command.js';
import { CreateUserHandler } from './create-user.handler.js';
import { PasswordHasher } from '../../../../../shared/security/password/password-hasher.js';

describe('CreateUserHandler', () => {
  it('hashea antes de la transacción y guarda únicamente el hash', async () => {
    const calls: string[] = [];
    const person = { firstName: 'Gabriel' } as Person;
    const user = { id: 'user-id', passwordHash: 'hash-seguro' } as User;
    const create = vi.fn(
      (entity: typeof Person | typeof User, data: object) => {
        if (entity === Person) return person;
        return Object.assign(user, data);
      },
    );
    const manager = {
      create,
      save: vi.fn(async (entity: Person | User) => entity),
    } as unknown as EntityManager;
    const unitOfWork = {
      execute: vi.fn(
        async (work: (manager: EntityManager) => Promise<User>) => {
          calls.push('transaction');
          return work(manager);
        },
      ),
    } as unknown as UnitOfWork;
    const hash = vi.fn(async () => {
      calls.push('hash');
      return 'hash-seguro';
    });
    const hasher = { hash } as unknown as PasswordHasher;
    const handler = new CreateUserHandler(unitOfWork, hasher);
    const command = new CreateUserCommand({
      nickName: 'Gabriel',
      email: 'gabriel@example.com',
      password: 'contraseña segura',
      person: {
        firstName: 'Gabriel',
        lastName: 'Pérez',
        identityDocument: '1234567890',
        dateOfBirth: '1990-01-31',
      },
    });

    await expect(handler.execute(command)).resolves.toBe(user);
    expect(calls).toEqual(['hash', 'transaction']);
    expect(hash).toHaveBeenCalledWith('contraseña segura');
    expect(create).toHaveBeenCalledWith(User, {
      nickName: 'Gabriel',
      nickNameNormalized: 'GABRIEL',
      email: 'gabriel@example.com',
      emailNormalized: 'GABRIEL@EXAMPLE.COM',
      passwordHash: 'hash-seguro',
      emailVerificationToken: null,
      persona: person,
    });
  });
});
