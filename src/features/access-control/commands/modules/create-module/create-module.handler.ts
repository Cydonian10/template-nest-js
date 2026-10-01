import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateModuleCommand } from './create-module.command.js';
import { SystemModule } from '../../../entities/module.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@CommandHandler(CreateModuleCommand)
export class CreateModuleHandler implements ICommandHandler<CreateModuleCommand> {
  constructor(
    @InjectRepository(SystemModule)
    private readonly moduleRepository: Repository<SystemModule>,
  ) {}

  async execute(command: CreateModuleCommand): Promise<SystemModule> {
    const module = this.moduleRepository.create({
      name: command.name,
      description: command.description,
      systemId: command.systemId,
      active: true,
    });
    return await this.moduleRepository.save(module);
  }
}
