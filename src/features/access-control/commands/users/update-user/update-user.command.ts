import type { UpdateUserDto } from '../../../dto/user/update-user.dto.js';

export class UpdateUserCommand {
  constructor(
    public readonly id: string,
    public readonly data: UpdateUserDto,
  ) {}
}
