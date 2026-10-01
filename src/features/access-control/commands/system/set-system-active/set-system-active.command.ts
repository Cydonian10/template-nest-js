export class SetSystemActiveCommand {
  constructor(
    public readonly id: string,
    public readonly active: boolean,
  ) {}
}
