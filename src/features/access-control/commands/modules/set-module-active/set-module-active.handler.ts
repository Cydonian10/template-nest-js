import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { SystemModule } from '../../../entities/module.entity.js';
import { SetModuleActiveCommand } from './set-module-active.command.js';

@CommandHandler(SetModuleActiveCommand)
export class SetModuleActiveHandler implements ICommandHandler<SetModuleActiveCommand> {
  constructor(
    @InjectRepository(SystemModule)
    private readonly modules: Repository<SystemModule>,
  ) {}

  async execute({
    systemId,
    id,
    active,
  }: SetModuleActiveCommand): Promise<SystemModule> {
    const module = await this.modules.findOneBy({
      id,
      system: { id: systemId },
    });
    if (!module) throw new ResourceNotFoundException('Módulo', id);
    if (module.active !== active) {
      module.active = active;
      await this.modules.save(module);
    }
    module.systemId = systemId;
    return module;
  }
}
