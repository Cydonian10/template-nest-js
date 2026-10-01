import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceNotFoundException } from '../../../../shared/exceptions/resource-not-found.exception.js';
import { System } from '../../entities/system.entity.js';
import { UpdateSystemCommand } from './update-system.command.js';

@CommandHandler(UpdateSystemCommand)
export class UpdateSystemHandler implements ICommandHandler<UpdateSystemCommand> {
  constructor(
    @InjectRepository(System)
    private readonly systems: Repository<System>,
  ) {}

  async execute({ id, data }: UpdateSystemCommand): Promise<System> {
    const system = await this.systems.findOneBy({ id });
    if (!system) throw new ResourceNotFoundException('Sistema', id);

    if (data.name !== undefined) system.name = data.name;
    if (data.path !== undefined) system.path = data.path;
    if (data.description !== undefined) system.description = data.description;
    if (data.order !== undefined) system.order = data.order;

    return this.systems.save(system);
  }
}
