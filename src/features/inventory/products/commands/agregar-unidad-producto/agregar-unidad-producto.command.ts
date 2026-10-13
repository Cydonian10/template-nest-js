export class AgregarUnidadProductoCommand {
  constructor(
    public readonly data: {
      productoId: string;
      unidadId: string;
      factorABase: string; // Para conservar la precisión del decimal.
    },
  ) {}
}
