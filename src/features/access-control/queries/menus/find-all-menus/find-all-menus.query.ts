export class FindAllMenusQuery {
  constructor(
    public readonly moduleId?: string,
    public readonly roleId?: string,
    public readonly systemId?: string,
  ) {}
}
