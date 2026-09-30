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
      persona: {
        id: 'person-id',
        firstName: 'Gabriel',
        lastName: 'Pérez',
        identityDocument: '123',
        dateOfBirth: '1990-01-31',
        active: true,
      },
    } as User;

    expect(UserResponseDto.from(user)).toEqual({
      id: user.id,
      email: user.email,
      nickName: user.nickName,
      emailVerified: user.emailVerified,
      active: user.active,
      person: {
        id: user.persona.id,
        firstName: user.persona.firstName,
        lastName: user.persona.lastName,
        identityDocument: user.persona.identityDocument,
        dateOfBirth: user.persona.dateOfBirth,
        active: true,
      },
    });
  });
});
