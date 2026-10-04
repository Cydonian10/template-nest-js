export class FindAllPermissionsQuery {
  constructor(
    public readonly roleId?: string,
    public readonly systemCode?: string,
    public readonly userId?: string,
    public readonly resourceCode?: string,
  ) {}
}
