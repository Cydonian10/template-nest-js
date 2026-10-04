import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { UserRole } from '../entities/user_roles.entity.js';
import { System } from '../entities/system.entity.js';
import { ROLE_CODES } from '../../../shared/authorization/role-codes.js';

@Injectable()
export class SystemPermissionsService {
  constructor(
    @InjectRepository(UserRole)
    private readonly assignments: Repository<UserRole>,
    @InjectRepository(System) private readonly systems: Repository<System>,
  ) {}

  async systemsForUser(userId: string): Promise<System[]> {
    const today = new Date().toISOString().slice(0, 10);
    const assignments = this.assignments
      .createQueryBuilder('assignment')
      .innerJoin('assignment.role', 'role')
      .where('assignment.user_id = :userId', { userId })
      .andWhere('assignment.valid_from <= :today', { today })
      .andWhere(
        '(assignment.valid_until IS NULL OR assignment.valid_until >= :today)',
        { today },
      );
    if (
      await assignments
        .clone()
        .andWhere('role.code = :admin', { admin: ROLE_CODES.SUPER_ADMIN })
        .getExists()
    ) {
      return this.systems.find({
        where: { active: true },
        order: { order: 'ASC' },
      });
    }
    const rows = await assignments
      .innerJoin('role.roleSystems', 'scope')
      .innerJoin('scope.system', 'system', 'system.active = true')
      .select('system.id', 'id')
      .distinct(true)
      .getRawMany<{ id: string }>();
    if (!rows.length) return [];
    return this.systems.find({
      where: { id: In(rows.map(({ id }) => id)), active: true },
      order: { order: 'ASC' },
    });
  }

  async allowedSystemIds(
    userId: string,
    permissionCode: string,
    manager?: EntityManager,
  ): Promise<string[]> {
    const today = new Date().toISOString().slice(0, 10);
    const assignments = (manager?.getRepository(UserRole) ?? this.assignments)
      .createQueryBuilder('assignment')
      .innerJoin('assignment.role', 'role')
      .where('assignment.user_id = :userId', { userId })
      .andWhere('assignment.valid_from <= :today', { today })
      .andWhere(
        '(assignment.valid_until IS NULL OR assignment.valid_until >= :today)',
        { today },
      );
    if (
      await assignments
        .clone()
        .andWhere('role.code = :admin', { admin: ROLE_CODES.SUPER_ADMIN })
        .getExists()
    ) {
      const systems = await (
        manager?.getRepository(System) ?? this.systems
      ).find({
        where: { active: true },
        select: { id: true },
      });
      return systems.map(({ id }) => id);
    }
    const rows = await assignments
      .innerJoin('role.roleSystems', 'scope')
      .innerJoin('scope.system', 'system', 'system.active = true')
      .innerJoin('role.rolePermissions', 'grant', 'grant.active = true')
      .innerJoin(
        'grant.permission',
        'permission',
        'permission.system_id = system.id AND permission.code = :code',
        { code: permissionCode },
      )
      .select('system.id', 'id')
      .distinct(true)
      .getRawMany<{ id: string }>();
    return rows.map(({ id }) => id);
  }

  async requireSystem(
    userId: string,
    systemId: string,
    permissionCode: string,
    manager?: EntityManager,
  ): Promise<void> {
    if (
      !(await this.allowedSystemIds(userId, permissionCode, manager)).includes(
        systemId,
      )
    ) {
      throw new ForbiddenException(
        'No puedes administrar permisos de este sistema',
      );
    }
  }
}
