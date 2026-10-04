import { z } from 'zod';

export const ReplaceRolePermissionsSchema = z.strictObject({
  permissionIds: z.array(z.uuid()).refine(
    (ids) => new Set(ids).size === ids.length,
    'No se permiten permisos repetidos',
  ),
});

export type ReplaceRolePermissionsDto = z.infer<
  typeof ReplaceRolePermissionsSchema
>;
