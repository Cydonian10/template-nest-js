export class FindSystemModuleQuery {
  constructor(
    public readonly systemId: string,
    public readonly moduleId: string,
  ) {}
}
