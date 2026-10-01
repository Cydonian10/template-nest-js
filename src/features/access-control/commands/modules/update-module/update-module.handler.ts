import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { SystemModule } from '../../../entities/module.entity.js';
import { UpdateModuleCommand } from './update-module.command.js';

@CommandHandler(UpdateModuleCommand)
export class UpdateModuleHandler implements ICommandHandler<UpdateModuleCommand> {
  constructor(
    @InjectRepository(SystemModule)
    private readonly modules: Repository<SystemModule>,
  ) {}

  async execute({
    systemId,
    id,
    data,
  }: UpdateModuleCommand): Promise<SystemModule> {
    const module = await this.modules.findOneBy({
      id,
      system: { id: systemId },
    });
    if (!module) throw new ResourceNotFoundException('Módulo', id);
    if (data.name !== undefined) module.name = data.name;
    if (data.description !== undefined) module.description = data.description;
    if (data.order !== undefined) module.order = data.order;
    const saved = await this.modules.save(module);
    saved.systemId = systemId;
    return saved;
  }
}
