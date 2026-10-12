export class FindAllUnidadesQuery {
  constructor(
    readonly filter: {
      page: number;
      limit: number;
    },
  ) {}
}
