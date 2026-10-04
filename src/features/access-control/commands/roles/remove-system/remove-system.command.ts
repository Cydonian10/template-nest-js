export class RemoveRoleSystemCommand {
  constructor(
    public readonly roleId: string,
    public readonly systemId: string,
  ) {}
}
