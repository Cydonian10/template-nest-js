import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { Role } from '../../../entities/roles.entity.js';
import { UpdateRoleCommand } from './update-role.command.js';

@CommandHandler(UpdateRoleCommand)
export class UpdateRoleHandler implements ICommandHandler<UpdateRoleCommand> {
  constructor(
    @InjectRepository(Role) private readonly roles: Repository<Role>,
  ) {}

  async execute({ id, data }: UpdateRoleCommand): Promise<Role> {
    const role = await this.roles.findOne({
      where: { id },
      relations: {
        userRoles: { user: true },
        rolePermissions: { permission: true },
        system: true,
      },
    });
    if (!role) throw new ResourceNotFoundException('Rol', id);
    Object.assign(role, data);
    return this.roles.save(role);
  }
}
