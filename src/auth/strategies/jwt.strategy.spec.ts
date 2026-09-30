import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Repository } from 'typeorm';
import { User } from '../../features/access-control/entities/user.entity.js';
import { JwtStrategy } from './jwt.strategy.js';

describe('JwtStrategy', () => {
  const findOne = vi.fn();
  const strategy = new JwtStrategy(
    {
      getOrThrow: vi
        .fn()
        .mockReturnValue('secreto-seguro-de-al-menos-32-caracteres'),
    } as unknown as ConfigService,
    { findOne } as unknown as Repository<User>,
  );

  beforeEach(() => vi.clearAllMocks());

  it('devuelve un principal sin credenciales para un usuario activo', async () => {
    findOne.mockResolvedValue({
      id: 'user-id',
      email: 'admin@example.com',
      active: true,
      persona: { active: true },
    });
    await expect(strategy.validate({ sub: 'user-id' })).resolves.toEqual({
      id: 'user-id',
      email: 'admin@example.com',
    });
    expect(findOne).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      relations: { persona: true },
    });
  });

  it('rechaza tokens sin sujeto o de usuarios inactivos', async () => {
    await expect(strategy.validate({})).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(findOne).not.toHaveBeenCalled();
    findOne.mockResolvedValue({
      id: 'user-id',
      active: false,
      persona: { active: true },
    });
    await expect(strategy.validate({ sub: 'user-id' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rechaza tokens de personas inactivas', async () => {
    findOne.mockResolvedValue({
      id: 'user-id',
      active: true,
      persona: { active: false },
    });
    await expect(strategy.validate({ sub: 'user-id' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
