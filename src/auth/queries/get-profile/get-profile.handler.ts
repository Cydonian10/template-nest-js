import { UnauthorizedException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { User } from '../../../features/access-control/entities/user.entity.js';
import type {
  ProfilePermissionDto,
  ProfileResponseDto,
  ProfileRoleDto,
} from '../../dto/profile-response.dto.js';
import { GetProfileQuery } from './get-profile.query.js';

@QueryHandler(GetProfileQuery)
export class GetProfileHandler implements IQueryHandler<GetProfileQuery> {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async execute(query: GetProfileQuery): Promise<ProfileResponseDto> {
    const user = await this.users.findOne({
      where: { id: query.userId, active: true },
      relations: {
        persona: true,
        userRoles: { role: { rolePermissions: { permission: true } } },
      },
    });
    if (!user?.persona?.active) throw new UnauthorizedException();

    const today = new Date().toISOString().slice(0, 10);
    const roles = new Map<string, ProfileRoleDto>();
    const permissions = new Map<string, ProfilePermissionDto>();

    for (const assignment of user.userRoles ?? []) {
      if (
        assignment.validFrom > today ||
        (assignment.validUntil && assignment.validUntil < today)
      ) {
        continue;
      }
      const role = assignment.role;
      roles.set(role.id, {
        id: role.id,
        code: role.code,
        name: role.name,
        description: role.description,
      });
      for (const grant of role.rolePermissions ?? []) {
        if (!grant.active) continue;
        const permission = grant.permission;
        permissions.set(permission.id, {
          id: permission.id,
          code: permission.code,
          name: permission.name,
          resourceCode: permission.resourceCode,
          actionCode: permission.actionCode,
        });
      }
    }

    return {
      id: user.id,
      email: user.email,
      nickName: user.nickName,
      emailVerified: user.emailVerified,
      active: user.active,
      person: {
        id: user.persona.id,
        firstName: user.persona.firstName,
        lastName: user.persona.lastName,
        dateOfBirth: user.persona.dateOfBirth,
        identityDocument: user.persona.identityDocument,
        active: user.persona.active,
      },
      roles: [...roles.values()],
      permissions: [...permissions.values()],
    };
  }
}
