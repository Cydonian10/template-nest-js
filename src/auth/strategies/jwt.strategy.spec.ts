import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Repository } from 'typeorm';
import { User } from '../../features/access-control/entities/user.entity.js';
import { JwtStrategy } from './jwt.strategy.js';

describe('JwtStrategy', () => {
  const findOneBy = vi.fn();
  const strategy = new JwtStrategy(
    {
      getOrThrow: vi
        .fn()
        .mockReturnValue('secreto-seguro-de-al-menos-32-caracteres'),
    } as unknown as ConfigService,
    { findOneBy } as unknown as Repository<User>,
  );

  beforeEach(() => vi.clearAllMocks());

  it('devuelve un principal sin credenciales para un usuario activo', async () => {
    findOneBy.mockResolvedValue({
      id: 'user-id',
      email: 'admin@example.com',
      active: true,
    });
    await expect(strategy.validate({ sub: 'user-id' })).resolves.toEqual({
      id: 'user-id',
      email: 'admin@example.com',
    });
    expect(findOneBy).toHaveBeenCalledWith({ id: 'user-id' });
  });

  it('rechaza tokens sin sujeto o de usuarios inactivos', async () => {
    await expect(strategy.validate({})).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(findOneBy).not.toHaveBeenCalled();
    findOneBy.mockResolvedValue({ id: 'user-id', active: false });
    await expect(strategy.validate({ sub: 'user-id' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
