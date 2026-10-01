import { z } from 'zod';

export const assignSystemModulesSchema = z
  .strictObject({
    moduleIds: z.array(z.uuid()).min(1),
  })
  .refine(({ moduleIds }) => new Set(moduleIds).size === moduleIds.length, {
    path: ['moduleIds'],
    message: 'Los identificadores de módulos no pueden repetirse',
  });

export type AssignSystemModulesDto = z.infer<typeof assignSystemModulesSchema>;
