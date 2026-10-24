export class CambiarEstadoMarcaCommand {
  constructor(
    public readonly id: string,
    public readonly activo: boolean,
  ) {}
}
