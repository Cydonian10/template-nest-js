export class RemoveUserRoleCommand {
  constructor(
    public readonly userId: string,
    public readonly assignmentId: string,
  ) {}
}
