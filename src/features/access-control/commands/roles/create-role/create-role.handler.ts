import { BadRequestException, ConflictException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Role } from '../../../entities/roles.entity.js';
import { roleCodeFromName } from '../role-code.js';
import { CreateRoleCommand } from './create-role.command.js';

@CommandHandler(CreateRoleCommand)
export class CreateRoleHandler implements ICommandHandler<CreateRoleCommand> {
  constructor(
    @InjectRepository(Role) private readonly roles: Repository<Role>,
  ) {}

  async execute({ data }: CreateRoleCommand): Promise<Role> {
    const code = roleCodeFromName(data.name);
    if (!code || code.length > 50)
      throw new BadRequestException('Nombre de rol inválido');
    if (await this.roles.exists({ where: { code } })) {
      throw new ConflictException('Ya existe un rol con ese código');
    }
    try {
      return await this.roles.save(this.roles.create({ ...data, code }));
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23505'
      ) {
        throw new ConflictException('Ya existe un rol con ese código');
      }
      throw error;
    }
  }
}
