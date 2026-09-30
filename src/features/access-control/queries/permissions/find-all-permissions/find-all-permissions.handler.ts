import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { Permission } from '../../../entities/permission.entity.js';
import { Role } from '../../../entities/roles.entity.js';
import { FindAllPermissionsQuery } from './find-all-permissions.query.js';

@QueryHandler(FindAllPermissionsQuery)
export class FindAllPermissionsHandler implements IQueryHandler<FindAllPermissionsQuery> {
  constructor(
    @InjectRepository(Permission)
    private readonly repository: Repository<Permission>,
    @InjectRepository(Role)
    private readonly roles: Repository<Role>,
  ) {}

  async execute({ roleId }: FindAllPermissionsQuery): Promise<Permission[]> {
    if (!roleId) return this.repository.find({ order: { name: 'ASC' } });

    if (!(await this.roles.existsBy({ id: roleId }))) {
      throw new ResourceNotFoundException('Rol', roleId);
    }

    return this.repository
      .createQueryBuilder('permission')
      .innerJoin('permission.rolePermissions', 'assignment')
      .where('assignment.role_id = :roleId', { roleId })
      .distinct(true)
      .orderBy('permission.name', 'ASC')
      .getMany();
  }
}
