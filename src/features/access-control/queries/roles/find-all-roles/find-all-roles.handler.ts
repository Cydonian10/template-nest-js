import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Role } from '../../../entities/roles.entity.js';
import { PERMISSION_CODES } from '../../../../../shared/authorization/permission-codes.js';
import { SystemPermissionsService } from '../../../services/system-permissions.service.js';
import { FindAllRolesQuery } from './find-all-roles.query.js';

@QueryHandler(FindAllRolesQuery)
export class FindAllRolesHandler implements IQueryHandler<FindAllRolesQuery> {
  constructor(
    @InjectRepository(Role) private readonly roles: Repository<Role>,
    private readonly scope: SystemPermissionsService,
  ) {}

  async execute({ userId }: FindAllRolesQuery): Promise<Role[]> {
    const allowed = await this.scope.allowedSystemIds(
      userId,
      PERMISSION_CODES.ROLES_READ,
    );
    if (!allowed.length) return [];
    return this.roles.find({
      where: { roleSystems: { system: { id: In(allowed), active: true } } },
      relations: { roleSystems: { system: true } },
      order: { name: 'ASC' },
    });
  }
}
