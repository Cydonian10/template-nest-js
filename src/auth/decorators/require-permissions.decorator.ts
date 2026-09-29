import { SetMetadata } from '@nestjs/common';

export const REQUIRED_PERMISSIONS_KEY = 'requiredPermissions';

// Si se indican varios códigos, el usuario debe tenerlos todos.
export const RequirePermissions = (...codes: string[]) =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, codes);
