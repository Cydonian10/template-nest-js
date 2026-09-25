import type { CreateUserDto } from '../../dto/user/create-user.dto.js';

export class CreateUserCommand {
  constructor(public readonly data: CreateUserDto) {}
}
