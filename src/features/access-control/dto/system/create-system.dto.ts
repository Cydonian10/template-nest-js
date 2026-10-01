import z from 'zod';

export const createSystemSchema = z.strictObject({
  name: z.string().min(1),
  path: z.string().min(1),
  description: z.string(),
  active: z.boolean().default(true).optional(),
  order: z.number().nonnegative().multipleOf(0.01).default(0).optional(),
});

export type CreateSystemDto = z.infer<typeof createSystemSchema>;
