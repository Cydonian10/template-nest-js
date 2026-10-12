import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FindAllUnidadesQuery } from './find-all-unidades.query.js';

@QueryHandler(FindAllUnidadesQuery)
export class FindAllPermissionsHandler implements IQueryHandler<FindAllUnidadesQuery> {
  constructor() {}

  execute(query: FindAllUnidadesQuery): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
