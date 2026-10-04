import type { UpdateRoleDto } from '../../../dto/role/update-role.dto.js';

export class UpdateRoleCommand {
  constructor(
    public readonly id: string,
    public readonly data: UpdateRoleDto,
  ) {}
}
