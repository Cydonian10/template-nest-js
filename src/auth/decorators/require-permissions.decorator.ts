import { applyDecorators, SetMetadata } from '@nestjs/common';
import type { SystemCode } from '../../shared/authorization/system-codes.js';

export const REQUIRED_PERMISSIONS_KEY = 'requiredPermissions';
export const REQUIRED_PERMISSION_SYSTEM_KEY = 'requiredPermissionSystem';

// Si se indican varios códigos, el usuario debe tenerlos todos.
export const RequirePermissions = (...codes: string[]) =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, codes);

/** Exige permisos del sistema indicado, aunque su código exista en otro sistema. */
export const RequirePermissionsInSystem = (
  systemCode: SystemCode,
  ...codes: string[]
) =>
  applyDecorators(
    RequirePermissions(...codes),
    SetMetadata(REQUIRED_PERMISSION_SYSTEM_KEY, systemCode),
  );
