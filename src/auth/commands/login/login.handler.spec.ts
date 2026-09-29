import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import { LoginCommand } from './login.command.js';
import { LoginHandler } from './login.handler.js';

describe('LoginHandler', () => {
  it('firma únicamente el identificador y devuelve la duración configurada', async () => {
    const signAsync = vi.fn().mockResolvedValue('jwt-firmado');
    const getOrThrow = vi.fn().mockReturnValue(3600);
    const handler = new LoginHandler(
      { signAsync } as unknown as JwtService,
      { getOrThrow } as unknown as ConfigService,
    );

    await expect(handler.execute(new LoginCommand('user-id'))).resolves.toEqual(
      {
        accessToken: 'jwt-firmado',
        tokenType: 'Bearer',
        expiresIn: 3600,
      },
    );
    expect(signAsync).toHaveBeenCalledWith({ sub: 'user-id' });
  });
});
