export const ROLE_CODES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;

export type RoleCode = (typeof ROLE_CODES)[keyof typeof ROLE_CODES];
