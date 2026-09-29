import type { User } from '../../entities/user.entity.js';
import { UserResponseDto } from './user-response.dto.js';

describe('UserResponseDto', () => {
  it('no expone contraseña, hash ni token de verificación', () => {
    const user = {
      id: 'user-id',
      email: 'gabriel@example.com',
      nickName: 'Gabriel',
      emailVerified: false,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      passwordHash: 'hash-secreto',
      emailVerificationToken: 'token-secreto',
    } as User;

    expect(UserResponseDto.from(user)).toEqual({
      id: user.id,
      email: user.email,
      nickName: user.nickName,
      emailVerified: user.emailVerified,
      active: user.active,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  });
});
