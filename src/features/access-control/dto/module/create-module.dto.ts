import { z } from 'zod';

export const createModuleSchema = z.strictObject({
  name: z.string().min(1),
  description: z.string().default(''),
  order: z.number().nonnegative().multipleOf(0.01).default(0).optional(),
  systemId: z.uuid(),
});

export type CreateModuleDto = z.infer<typeof createModuleSchema>;

export const createSystemModuleSchema = createModuleSchema.omit({
  systemId: true,
});

export type CreateSystemModuleDto = z.infer<typeof createSystemModuleSchema>;
