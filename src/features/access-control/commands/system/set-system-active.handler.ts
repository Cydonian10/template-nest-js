import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceNotFoundException } from '../../../../shared/exceptions/resource-not-found.exception.js';
import { System } from '../../entities/system.entity.js';
import { SetSystemActiveCommand } from './set-system-active.command.js';

@CommandHandler(SetSystemActiveCommand)
export class SetSystemActiveHandler implements ICommandHandler<SetSystemActiveCommand> {
  constructor(
    @InjectRepository(System)
    private readonly systems: Repository<System>,
  ) {}

  async execute({ id, active }: SetSystemActiveCommand): Promise<System> {
    const system = await this.systems.findOneBy({ id });
    if (!system) throw new ResourceNotFoundException('Sistema', id);
    if (system.active === active) return system;

    system.active = active;
    return this.systems.save(system);
  }
}
