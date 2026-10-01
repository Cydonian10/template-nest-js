export class DeleteModuleCommand {
  constructor(
    public readonly systemId: string,
    public readonly id: string,
  ) {}
}
