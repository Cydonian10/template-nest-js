import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { Menu } from '../../../entities/menu.entity.js';
import { SystemModule } from '../../../entities/module.entity.js';
import { UpdateMenuCommand } from './update-menu.command.js';

@CommandHandler(UpdateMenuCommand)
export class UpdateMenuHandler implements ICommandHandler<UpdateMenuCommand> {
  constructor(
    @InjectRepository(Menu) private readonly menus: Repository<Menu>,
    @InjectRepository(SystemModule)
    private readonly modules: Repository<SystemModule>,
  ) {}

  async execute({ id, data }: UpdateMenuCommand): Promise<Menu> {
    const menu = await this.menus.findOne({
      where: { id },
      relations: { module: true },
    });
    if (!menu) throw new ResourceNotFoundException('Menú', id);
    if (data.moduleId && data.moduleId !== menu.module.id) {
      const module = await this.modules.findOneBy({ id: data.moduleId });
      if (!module) throw new ResourceNotFoundException('Módulo', data.moduleId);
      menu.module = module;
    }
    if (data.name !== undefined) menu.name = data.name;
    if (data.path !== undefined) menu.path = data.path;
    if (data.description !== undefined) menu.description = data.description;
    return this.menus.save(menu);
  }
}
