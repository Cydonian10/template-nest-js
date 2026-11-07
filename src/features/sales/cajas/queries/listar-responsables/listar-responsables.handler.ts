import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { ListarResponsablesQuery } from './listar-responsables.query.js';

@QueryHandler(ListarResponsablesQuery)
export class ListarResponsablesHandler implements IQueryHandler<ListarResponsablesQuery> {
  constructor(private readonly dataSource: DataSource) {}

  async execute(): Promise<{ id: string; nickName: string }[]> {
    return this.dataSource.query(
      `SELECT u.id, u.nick_name AS "nickName" FROM users u
       JOIN persons p ON p.id = u.persona_id
       WHERE u.active = true AND p.active = true ORDER BY u.nick_name, u.id`,
    );
  }
}
