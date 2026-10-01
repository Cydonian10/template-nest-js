import { z } from 'zod';

export const CreateMenuSchema = z.strictObject({
  moduleId: z.uuid(),
  name: z.string().trim().min(1).max(100),
  path: z.string().trim().min(1),
  description: z.string().trim().min(1),
  order: z.number().nonnegative().multipleOf(0.01).optional(),
});

export type CreateMenuDto = z.infer<typeof CreateMenuSchema>;

export const CreateModuleMenuSchema = CreateMenuSchema.omit({ moduleId: true });
export type CreateModuleMenuDto = z.infer<typeof CreateModuleMenuSchema>;
