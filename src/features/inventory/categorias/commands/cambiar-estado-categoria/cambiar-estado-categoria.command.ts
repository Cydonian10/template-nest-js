export class CambiarEstadoCategoriaCommand {
  constructor(
    public readonly id: string,
    public readonly activo: boolean,
  ) {}
}
