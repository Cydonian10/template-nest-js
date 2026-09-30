import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import type { Request } from 'express';
import type { Repository } from 'typeorm';
import { UserRole } from '../../features/access-control/entities/user_roles.entity.js';
import { ROLE_CODES } from '../../shared/authorization/role-codes.js';
import { REQUIRED_PERMISSIONS_KEY } from '../decorators/require-permissions.decorator.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface.js';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(UserRole)
    private readonly assignments: Repository<UserRole>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets)) {
      return true;
    }

    const required = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_PERMISSIONS_KEY,
      targets,
    );
    if (!required?.length) return true;

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser }>();
    if (!request.user?.id) throw new UnauthorizedException();

    const today = new Date().toISOString().slice(0, 10);
    const grants = await this.assignments
      .createQueryBuilder('assignment')
      .innerJoin('assignment.role', 'role')
      .leftJoin('role.rolePermissions', 'grant', 'grant.active = :active', {
        active: true,
      })
      .leftJoin(
        'grant.permission',
        'permission',
        'permission.code IN (:...required)',
        { required },
      )
      .select('role.code', 'roleCode')
      .addSelect('permission.code', 'code')
      .distinct(true)
      .where('assignment.user_id = :userId', { userId: request.user.id })
      .andWhere('assignment.valid_from <= :today', { today })
      .andWhere(
        '(assignment.valid_until IS NULL OR assignment.valid_until >= :today)',
        {
          today,
        },
      )
      .getRawMany<{ roleCode: string; code: string | null }>();

    if (grants.some(({ roleCode }) => roleCode === ROLE_CODES.SUPER_ADMIN)) {
      return true;
    }

    const codes = new Set(grants.map(({ code }) => code).filter(Boolean));
    if (!required.every((code) => codes.has(code))) {
      throw new ForbiddenException('No tienes los permisos requeridos');
    }
    return true;
  }
}
