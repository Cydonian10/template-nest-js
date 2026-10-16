export class EliminarUnidadProductoCommand {
  constructor(
    readonly productoId: string,
    readonly asignacionId: string,
  ) {}
}
