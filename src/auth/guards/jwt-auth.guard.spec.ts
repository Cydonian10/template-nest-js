import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard.js';

describe('JwtAuthGuard', () => {
  it('omite JWT en rutas marcadas como públicas', () => {
    const getAllAndOverride = vi.fn().mockReturnValue(true);
    const guard = new JwtAuthGuard({
      getAllAndOverride,
    } as unknown as Reflector);
    const handler = vi.fn();
    const controller = class {};
    const context = {
      getHandler: () => handler,
      getClass: () => controller,
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
    expect(getAllAndOverride).toHaveBeenCalledWith('isPublic', [
      handler,
      controller,
    ]);
  });
});
