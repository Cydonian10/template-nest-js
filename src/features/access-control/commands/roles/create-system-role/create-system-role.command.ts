import type { CreateSystemRoleDto } from '../../../dto/role/create-role.dto.js';

export class CreateSystemRoleCommand {
  constructor(
    public readonly systemId: string,
    public readonly userId: string,
    public readonly data: CreateSystemRoleDto,
  ) {}
}
