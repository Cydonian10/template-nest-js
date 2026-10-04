import { z } from 'zod';

export const ProfilePersonSchema = z.strictObject({
  id: z.uuid(),
  firstName: z.string(),
  lastName: z.string(),
  dateOfBirth: z.iso.date(),
  identityDocument: z.string(),
  active: z.boolean(),
});

export type ProfilePersonDto = z.infer<typeof ProfilePersonSchema>;

export const ProfileRoleSchema = z.strictObject({
  id: z.uuid(),
  code: z.string(),
  name: z.string(),
  description: z.string(),
});

export type ProfileRoleDto = z.infer<typeof ProfileRoleSchema>;

export const ProfilePermissionSchema = z.strictObject({
  id: z.uuid(),
  code: z.string(),
  name: z.string(),
  systemCode: z.string(),
  systemId: z.uuid(),
  resourceCode: z.string(),
  actionCode: z.string(),
});

export type ProfilePermissionDto = z.infer<typeof ProfilePermissionSchema>;

export const ProfileResponseSchema = z.strictObject({
  id: z.uuid(),
  email: z.email(),
  nickName: z.string(),
  emailVerified: z.boolean(),
  active: z.boolean(),
  person: ProfilePersonSchema,
  roles: z.array(ProfileRoleSchema),
  permissions: z.array(ProfilePermissionSchema),
});

export type ProfileResponseDto = z.infer<typeof ProfileResponseSchema>;
