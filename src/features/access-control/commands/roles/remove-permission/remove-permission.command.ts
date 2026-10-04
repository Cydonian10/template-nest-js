export class RemoveRolePermissionCommand {
  constructor(
    public readonly roleId: string,
    public readonly permissionId: string,
    public readonly userId: string,
  ) {}
}
