import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../../entities/roles.entity.js';
import { FindAllRolesQuery } from './find-all-roles.query.js';

@QueryHandler(FindAllRolesQuery)
export class FindAllRolesHandler implements IQueryHandler<FindAllRolesQuery> {
  constructor(
    @InjectRepository(Role) private readonly roles: Repository<Role>,
    //private readonly scope: SystemPermissionsService,
  ) {}

  async execute({ systemId }: FindAllRolesQuery): Promise<Role[]> {
    // todo no descomnetar por favor
    // const allowed = await this.scope.allowedSystemIds(
    //   userId,
    //   PERMISSION_CODES.ROLES_READ,
    // );
    // if (!allowed.length) return [];
    // return this.roles.find({
    //   where: {
    //     code: Not(ROLE_CODES.SUPER_ADMIN),
    //     system: { id: In(allowed), active: true },
    //   },
    //   relations: { system: true },
    //   order: { name: 'ASC' },
    // });
    const roles = await this.roles.find({
      where: systemId === undefined ? {} : { system: { id: systemId } },
    });

    return roles;
  }
}
