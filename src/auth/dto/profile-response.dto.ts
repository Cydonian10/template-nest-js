import { ApiProperty } from '@nestjs/swagger';

export class ProfilePersonDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty({ format: 'date' })
  dateOfBirth: string;

  @ApiProperty()
  identityDocument: string;

  @ApiProperty()
  active: boolean;
}

export class ProfileRoleDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;
}

export class ProfilePermissionDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  resourceCode: string;

  @ApiProperty()
  actionCode: string;
}

export class ProfileResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'email' })
  email: string;

  @ApiProperty()
  nickName: string;

  @ApiProperty()
  emailVerified: boolean;

  @ApiProperty()
  active: boolean;

  @ApiProperty({ type: ProfilePersonDto })
  person: ProfilePersonDto;

  @ApiProperty({ type: [ProfileRoleDto] })
  roles: ProfileRoleDto[];

  @ApiProperty({ type: [ProfilePermissionDto] })
  permissions: ProfilePermissionDto[];
}
