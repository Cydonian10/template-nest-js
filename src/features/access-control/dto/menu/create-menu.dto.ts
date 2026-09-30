import { z } from 'zod';

export const CreateMenuSchema = z.strictObject({
  moduleId: z.uuid(),
  name: z.string().trim().min(1).max(100),
  path: z.string().trim().min(1),
  description: z.string().trim().min(1),
});

export type CreateMenuDto = z.infer<typeof CreateMenuSchema>;
