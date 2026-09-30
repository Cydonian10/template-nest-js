import type { AssignRoleDto } from '../../../dto/role/assign-role.dto.js';

export class AssignUserRoleCommand {
  constructor(
    public readonly userId: string,
    public readonly data: AssignRoleDto,
  ) {}
}
