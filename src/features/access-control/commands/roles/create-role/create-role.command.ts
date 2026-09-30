import type { CreateRoleDto } from '../../../dto/role/create-role.dto.js';

export class CreateRoleCommand {
  constructor(public readonly data: CreateRoleDto) {}
}
