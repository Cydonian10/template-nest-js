import { z } from 'zod';

export const CreateSystemRoleSchema = z.strictObject({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1),
});

export const CreateRoleSchema = CreateSystemRoleSchema.extend({
  systemId: z.uuid(),
});

export type CreateRoleDto = z.infer<typeof CreateRoleSchema>;
export type CreateSystemRoleDto = z.infer<typeof CreateSystemRoleSchema>;
