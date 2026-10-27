export class GuardarMinimoCommand {
  constructor(
    readonly varianteId: string,
    readonly almacenId: string,
    readonly minimoBase: string,
  ) {}
}
