import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  tokenType: 'Bearer';

  @ApiProperty()
  expiresIn: number;

  static from(obj: any): LoginResponseDto {
    return {
      accessToken: obj.accessToken,
      tokenType: obj.tokenType,
      expiresIn: obj.expiresIn,
    };
  }
}
