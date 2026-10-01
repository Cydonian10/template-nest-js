export class SetModuleActiveCommand {
  constructor(
    public readonly systemId: string,
    public readonly id: string,
    public readonly active: boolean,
  ) {}
}
