export class AssignSystemModulesCommand {
  constructor(
    public readonly systemId: string,
    public readonly moduleIds: string[],
  ) {}
}
