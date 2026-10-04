import { z } from 'zod';
import { CreateSystemRoleSchema } from './create-role.dto.js';

export const UpdateRoleSchema = CreateSystemRoleSchema.partial();
export type UpdateRoleDto = z.infer<typeof UpdateRoleSchema>;
