import { z } from 'zod';

export const AssignRoleSchema = z
  .strictObject({
    roleId: z.uuid(),
    validFrom: z.iso.date(),
    validUntil: z.iso.date().nullable().optional(),
  })
  .refine(
    ({ validFrom, validUntil }) => !validUntil || validFrom <= validUntil,
    {
      path: ['validUntil'],
      message: 'La fecha final no puede ser anterior a la inicial',
    },
  );

export type AssignRoleDto = z.infer<typeof AssignRoleSchema>;
