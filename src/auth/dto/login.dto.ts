import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@example.com', format: 'email' })
  email: string;

  @ApiProperty({ example: 'una-clave-segura', format: 'password' })
  password: string;
}
