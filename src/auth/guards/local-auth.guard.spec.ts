import { BadRequestException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { LocalAuthGuard } from './local-auth.guard.js';

describe('LocalAuthGuard', () => {
  it('rechaza un cuerpo inválido antes de autenticar', () => {
    const guard = new LocalAuthGuard();
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ body: { email: 'mal', password: 'corta' } }),
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(context)).toThrow(BadRequestException);
  });
});
