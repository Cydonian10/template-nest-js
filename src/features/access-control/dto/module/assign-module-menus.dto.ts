import { z } from 'zod';

export const assignModuleMenusSchema = z
  .strictObject({ menuIds: z.array(z.uuid()).min(1) })
  .refine(({ menuIds }) => new Set(menuIds).size === menuIds.length, {
    path: ['menuIds'],
    message: 'Los identificadores de menús no pueden repetirse',
  });

export type AssignModuleMenusDto = z.infer<typeof assignModuleMenusSchema>;
