export class QuitarAtributoProductoCommand {
  constructor(
    public readonly productoId: string,
    public readonly atributoId: string,
  ) {}
}
