import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { Menu } from '../../../entities/menu.entity.js';
import { SystemModule } from '../../../entities/module.entity.js';
import { CreateMenuCommand } from './create-menu.command.js';

@CommandHandler(CreateMenuCommand)
export class CreateMenuHandler implements ICommandHandler<CreateMenuCommand> {
  constructor(
    @InjectRepository(Menu) private readonly menus: Repository<Menu>,
    @InjectRepository(SystemModule)
    private readonly modules: Repository<SystemModule>,
  ) {}

  async execute({ data, systemId }: CreateMenuCommand): Promise<Menu> {
    const module = await this.modules.findOneBy({
      id: data.moduleId,
      ...(systemId ? { system: { id: systemId } } : {}),
    });
    if (!module) throw new ResourceNotFoundException('Módulo', data.moduleId);
    return this.menus.save(
      this.menus.create({
        module,
        name: data.name,
        path: data.path,
        description: data.description,
        active: true,
      }),
    );
  }
}
