import { SetMetadata } from '@nestjs/common';

export const PERMISSION_BY_BODY_TYPE_KEY = 'permissionByBodyType';

/** Selecciona exactamente un permiso según el tipo de operación recibido. */
export const RequirePermissionByBodyType = (codes: Record<string, string>) =>
  SetMetadata(PERMISSION_BY_BODY_TYPE_KEY, codes);
