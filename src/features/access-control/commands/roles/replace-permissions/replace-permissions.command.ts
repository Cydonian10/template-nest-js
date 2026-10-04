export class ReplaceRolePermissionsCommand {
  constructor(
    public readonly roleId: string,
    public readonly permissionIds: string[],
  ) {}
}
