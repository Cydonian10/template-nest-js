import {
  BadRequestException,
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
import { PERMISSION_DEFINITIONS } from '../../shared/authorization/permission-definitions.js';
import {
  REQUIRED_PERMISSIONS_KEY,
  REQUIRED_PERMISSION_SYSTEM_KEY,
} from '../decorators/require-permissions.decorator.js';
import { PERMISSION_BY_BODY_TYPE_KEY } from '../decorators/require-permission-by-body-type.decorator.js';
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

    const required =
      this.reflector.getAllAndOverride<string[]>(
        REQUIRED_PERMISSIONS_KEY,
        targets,
      ) ?? [];
    const requiredSystem = this.reflector.getAllAndOverride<string>(
      REQUIRED_PERMISSION_SYSTEM_KEY,
      targets,
    );
    const byType = this.reflector.getAllAndOverride<Record<string, string>>(
      PERMISSION_BY_BODY_TYPE_KEY,
      targets,
    );
    if (!required.length && !byType) return true;

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser }>();
    if (!request.user?.id) throw new UnauthorizedException();

    const tipo = (request.body as { tipo?: unknown } | undefined)?.tipo;
    const selected =
      byType && typeof tipo === 'string' && Object.hasOwn(byType, tipo)
        ? byType[tipo]
        : undefined;
    if (byType && !selected)
      throw new BadRequestException('Tipo de operación no válido');
    const permissions = selected ? [...required, selected] : required;

    const expected = PERMISSION_DEFINITIONS.filter(
      ({ code, systemCode }) =>
        permissions.includes(code) &&
        (!requiredSystem || systemCode === requiredSystem),
    );
    const systemCodes = [
      ...new Set(expected.map(({ systemCode }) => systemCode)),
    ];
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
        { required: permissions },
      )
      .leftJoin(
        'permission.system',
        'system',
        'system.active = true AND system.code IN (:...systemCodes)',
        {
          systemCodes: systemCodes.length ? systemCodes : ['__UNKNOWN__'],
        },
      )
      .leftJoin('role.system', 'scope', 'scope.id = system.id')
      .select('role.code', 'roleCode')
      .addSelect(
        'CASE WHEN scope.active = true THEN permission.code END',
        'code',
      )
      .addSelect('system.code', 'systemCode')
      .distinct(true)
      .where('assignment.user_id = :userId', { userId: request.user.id })
      .andWhere('assignment.valid_from <= :today', { today })
      .andWhere(
        '(assignment.valid_until IS NULL OR assignment.valid_until >= :today)',
        {
          today,
        },
      )
      .getRawMany<{
        roleCode: string;
        code: string | null;
        systemCode: string | null;
      }>();

    if (grants.some(({ roleCode }) => roleCode === ROLE_CODES.SUPER_ADMIN)) {
      return true;
    }

    const granted = new Set(
      grants.map(({ code, systemCode }) => `${systemCode}/${code}`),
    );
    if (
      !permissions.every((code) =>
        expected.some(
          (definition) =>
            definition.code === code &&
            granted.has(`${definition.systemCode}/${code}`),
        ),
      )
    ) {
      throw new ForbiddenException('No tienes los permisos requeridos');
    }
    return true;
  }
}
