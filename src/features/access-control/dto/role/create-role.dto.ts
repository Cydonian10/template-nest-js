import { z } from 'zod';

export const CreateRoleSchema = z.strictObject({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1),
});

export type CreateRoleDto = z.infer<typeof CreateRoleSchema>;
