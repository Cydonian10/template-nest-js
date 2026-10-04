import { SYSTEM_CODES } from './system-codes.js';
import type { PermissionCode } from './permission-codes.js';
import type { SystemCode } from './system-codes.js';
import { ACCESS_CONTROL_PERMISSIONS } from './permission-definitions/access-control.js';

export type PermissionDefinition = {
  code: PermissionCode;
  name: string;
  resourceCode: string;
  actionCode: string;
};

export type SystemPermissionDefinition = PermissionDefinition & {
  systemCode: SystemCode;
};

/** Catálogo único para el seed; agrega aquí los archivos de los sistemas nuevos. */
export const PERMISSION_DEFINITIONS: readonly SystemPermissionDefinition[] =
  ACCESS_CONTROL_PERMISSIONS.map((definition) => ({
    ...definition,
    systemCode: SYSTEM_CODES.ACCESS_CONTROL,
  }));
