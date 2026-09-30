import { ApiProperty } from '@nestjs/swagger';
import type { User } from '../../entities/user.entity.js';

export class PersonResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  identityDocument: string;

  @ApiProperty({ format: 'date' })
  dateOfBirth: string;

  @ApiProperty()
  active: boolean;
}

export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  nickName: string;

  @ApiProperty()
  emailVerified: boolean;

  @ApiProperty()
  active: boolean;

  @ApiProperty({ type: PersonResponseDto })
  person: PersonResponseDto;

  static from(user: User): UserResponseDto {
    return {
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
        active: user.persona.active,
      },
    };
  }
}
