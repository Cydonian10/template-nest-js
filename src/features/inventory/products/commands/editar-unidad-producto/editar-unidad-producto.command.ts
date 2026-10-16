export class EditarUnidadProductoCommand {
  constructor(
    readonly productoId: string,
    readonly asignacionId: string,
    readonly factorABase: string,
  ) {}
}
