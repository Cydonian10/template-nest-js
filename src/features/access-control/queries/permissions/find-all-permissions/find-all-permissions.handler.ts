import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { Permission } from '../../../entities/permission.entity.js';
import { Role } from '../../../entities/roles.entity.js';
import { In } from 'typeorm';
import { PERMISSION_CODES } from '../../../../../shared/authorization/permission-codes.js';
import { SystemPermissionsService } from '../../../services/system-permissions.service.js';
import { FindAllPermissionsQuery } from './find-all-permissions.query.js';

@QueryHandler(FindAllPermissionsQuery)
export class FindAllPermissionsHandler implements IQueryHandler<FindAllPermissionsQuery> {
  constructor(
    @InjectRepository(Permission)
    private readonly repository: Repository<Permission>,
    @InjectRepository(Role)
    private readonly roles: Repository<Role>,
    private readonly scope: SystemPermissionsService,
  ) {}

  async execute({
    roleId,
    systemCode,
    userId,
  }: FindAllPermissionsQuery): Promise<Permission[]> {
    if (!userId) return [];
    const allowed = await this.scope.allowedSystemIds(
      userId,
      PERMISSION_CODES.PERMISSIONS_READ,
    );
    if (!allowed.length) return [];
    if (!roleId)
      return this.repository.find({
        where: {
          system: {
            id: In(allowed),
            active: true,
            ...(systemCode ? { code: systemCode } : {}),
          },
        },
        relations: { system: true },
        order: { name: 'ASC' },
      });

    if (!(await this.roles.existsBy({ id: roleId }))) {
      throw new ResourceNotFoundException('Rol', roleId);
    }

    const builder = this.repository
      .createQueryBuilder('permission')
      .innerJoin('permission.rolePermissions', 'assignment')
      .where('assignment.role_id = :roleId', { roleId })
      .innerJoinAndSelect(
        'permission.system',
        'system',
        'system.active = true AND system.id IN (:...allowed)',
        { allowed },
      )
      .distinct(true)
      .orderBy('permission.name', 'ASC');
    if (systemCode) {
      builder.andWhere('system.code = :systemCode', { systemCode });
    }
    return builder.getMany();
  }
}
