export class FindAllRolesQuery {
  constructor(
    public readonly userId: string,
    public readonly systemId?: string,
  ) {}
}
