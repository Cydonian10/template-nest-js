export class CreateUnidaCommand {
  constructor(
    public readonly data: {
      nombre: string;
      simbolo: string;
      tipo: string;
    },
  ) {}
}
