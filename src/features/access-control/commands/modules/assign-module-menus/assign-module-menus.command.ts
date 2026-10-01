export class AssignModuleMenusCommand {
  constructor(
    public readonly systemId: string,
    public readonly moduleId: string,
    public readonly menuIds: string[],
  ) {}
}
