import z from 'zod';

export const CreatePersonSchema = z.strictObject({
  lastName: z.string().trim().min(1).max(100),
  firstName: z.string().trim().min(1).max(100),
  identityDocument: z.string().trim().min(1).max(50),
  dateOfBirth: z.iso.date(),
});

export type CreatePersonDto = z.infer<typeof CreatePersonSchema>;
