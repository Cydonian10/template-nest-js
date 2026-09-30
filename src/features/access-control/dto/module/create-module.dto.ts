import { z } from 'zod';


export const createModuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  systemId: z.uuid(),
});

export type CreateModuleDto = z.infer<typeof createModuleSchema>;
