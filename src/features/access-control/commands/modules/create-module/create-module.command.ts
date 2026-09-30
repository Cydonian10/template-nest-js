export class CreateModuleCommand {
  constructor(public readonly name: string, public readonly description: string, public readonly systemId: string) {}
}