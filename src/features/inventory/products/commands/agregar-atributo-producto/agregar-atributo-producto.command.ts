export class AgregarAtributoProductoCommand {
  constructor(
    public readonly data: {
      productoId: string;
      atributoId: string;
    },
  ) {}
}
