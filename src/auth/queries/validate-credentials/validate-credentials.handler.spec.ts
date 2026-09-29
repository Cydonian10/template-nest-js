import { UnauthorizedException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { User } from '../../../features/access-control/entities/user.entity.js';
import type { PasswordHasher } from '../../../shared/security/password/password-hasher.js';
import { ValidateCredentialsHandler } from './validate-credentials.handler.js';
import { ValidateCredentialsQuery } from './validate-credentials.query.js';

describe('ValidateCredentialsHandler', () => {
  const user = {
    id: 'user-id',
    passwordHash: 'hash-argon2',
    active: true,
  } as User;
  const findOneBy = vi.fn();
  const verify = vi.fn();
  const handler = new ValidateCredentialsHandler(
    { findOneBy } as unknown as Repository<User>,
    { verify } as unknown as PasswordHasher,
  );

  beforeEach(() => vi.clearAllMocks());

  it('valida el correo normalizado y el hash', async () => {
    findOneBy.mockResolvedValue(user);
    verify.mockResolvedValue(true);

    await expect(
      handler.execute(
        new ValidateCredentialsQuery('admin@example.com', 'clave'),
      ),
    ).resolves.toBe(user);
    expect(findOneBy).toHaveBeenCalledWith({
      emailNormalized: 'ADMIN@EXAMPLE.COM',
    });
    expect(verify).toHaveBeenCalledWith('clave', 'hash-argon2');
  });

  it.each([
    ['usuario inexistente', null, false],
    ['usuario inactivo', { id: user.id, active: false } as User, true],
    ['contraseña incorrecta', user, false],
  ])('rechaza %s', async (_label, found, matches) => {
    findOneBy.mockResolvedValue(found);
    verify.mockResolvedValue(matches);
    await expect(
      handler.execute(
        new ValidateCredentialsQuery('admin@example.com', 'incorrecta'),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rechaza datos inválidos sin consultar la base de datos', async () => {
    await expect(
      handler.execute(
        new ValidateCredentialsQuery(null as unknown as string, 'clave'),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(findOneBy).not.toHaveBeenCalled();
  });
});
