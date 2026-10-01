import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateSystemCommand } from './create-system.command.js';
import { InjectRepository } from '@nestjs/typeorm';
import { System } from '../../entities/system.entity.js';
import { Repository } from 'typeorm';

@CommandHandler(CreateSystemCommand)
export class CreateSystemHandler implements ICommandHandler<CreateSystemCommand> {
  constructor(
    @InjectRepository(System)
    private readonly systemRepo: Repository<System>,
  ) {}

  execute(command: CreateSystemCommand): Promise<System> {
    const newSystem = this.systemRepo.create({
      name: command.data.name,
      path: command.data.path,
      description: command.data.description,
      active: command.data.active,
      order: command.data.order,
    });

    return this.systemRepo.save(newSystem);
  }
}
