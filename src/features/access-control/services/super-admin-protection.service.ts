import { ConflictException, Injectable } from '@nestjs/common';
import type { EntityManager } from 'typeorm';
import { ROLE_CODES } from '../../../shared/authorization/role-codes.js';
import { Role } from '../entities/roles.entity.js';
import { UserRole } from '../entities/user_roles.entity.js';

@Injectable()
export class SuperAdminProtectionService {
  /** Serializa las desactivaciones para no bloquear simultáneamente a los dos últimos administradores. */
  async ensureCanDeactivate(
    manager: EntityManager,
    userId: string,
  ): Promise<void> {
    const role = await manager.findOne(Role, {
      where: { code: ROLE_CODES.SUPER_ADMIN },
      lock: { mode: 'pessimistic_write' },
    });
    if (!role) return;

    const today = new Date().toISOString().slice(0, 10);
    const eligible = manager
      .createQueryBuilder(UserRole, 'assignment')
      .innerJoin('assignment.user', 'user')
      .innerJoin('user.persona', 'person')
      .where('assignment.role_id = :roleId', { roleId: role.id })
      .andWhere('user.active = :active', { active: true })
      .andWhere('person.active = :active', { active: true })
      .andWhere('assignment.valid_from <= :today', { today })
      .andWhere(
        '(assignment.valid_until IS NULL OR assignment.valid_until >= :today)',
        { today },
      );

    const targetCount = await eligible
      .clone()
      .andWhere('user.id = :userId', { userId })
      .getCount();
    const remaining = await eligible
      .select('COUNT(DISTINCT user.id)', 'count')
      .getRawOne<{ count: string }>();
    if (targetCount && Number(remaining?.count ?? 0) <= 1) {
      throw new ConflictException(
        'No se puede desactivar al último SuperAdmin activo',
      );
    }
  }
}
