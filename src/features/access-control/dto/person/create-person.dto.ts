import z from 'zod';

export const CreatePersonSchema = z.strictObject({
  lastName: z.string().trim().min(1).max(100),
  firstName: z.string().trim().min(1).max(100),
  documentNumber: z.string().trim().min(1).max(50),
  birthDate: z.iso.date(),
  phone: z.string().trim().min(1).max(30),
});

export type CreatePersonDto = z.infer<typeof CreatePersonSchema>;
