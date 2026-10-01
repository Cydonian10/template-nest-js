import z from 'zod';

export const createSystemSchema = z.strictObject({
  name: z.string().min(1),
  path: z.string().min(1),
  description: z.string(),
  active: z.boolean().default(true).optional(),
});

export type CreateSystemDto = z.infer<typeof createSystemSchema>;
