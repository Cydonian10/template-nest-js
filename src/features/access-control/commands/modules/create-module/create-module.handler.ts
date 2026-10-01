import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateModuleCommand } from './create-module.command.js';
import { SystemModule } from '../../../entities/module.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { System } from '../../../entities/system.entity.js';

@CommandHandler(CreateModuleCommand)
export class CreateModuleHandler implements ICommandHandler<CreateModuleCommand> {
  constructor(
    @InjectRepository(SystemModule)
    private readonly moduleRepository: Repository<SystemModule>,
    @InjectRepository(System)
    private readonly systemRepository: Repository<System>,
  ) {}

  async execute(command: CreateModuleCommand): Promise<SystemModule> {
    const system = await this.systemRepository.findOneBy({
      id: command.systemId,
    });
    if (!system) {
      throw new ResourceNotFoundException('Sistema', command.systemId);
    }

    const module = this.moduleRepository.create({
      name: command.name,
      description: command.description,
      system,
      active: true,
      order: command.order,
    });
    const savedModule = await this.moduleRepository.save(module);
    savedModule.systemId = system.id;
    return savedModule;
  }
}
