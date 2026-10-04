export class AssignRoleSystemCommand {
  constructor(
    public readonly roleId: string,
    public readonly systemId: string,
  ) {}
}
