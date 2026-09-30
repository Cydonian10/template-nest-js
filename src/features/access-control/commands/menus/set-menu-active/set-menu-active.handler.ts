import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { Menu } from '../../../entities/menu.entity.js';
import { SetMenuActiveCommand } from './set-menu-active.command.js';

@CommandHandler(SetMenuActiveCommand)
export class SetMenuActiveHandler implements ICommandHandler<SetMenuActiveCommand> {
  constructor(
    @InjectRepository(Menu) private readonly menus: Repository<Menu>,
  ) {}

  async execute({ id, active }: SetMenuActiveCommand): Promise<Menu> {
    const menu = await this.menus.findOneBy({ id });
    if (!menu) throw new ResourceNotFoundException('Menú', id);
    if (menu.active === active) return menu;
    menu.active = active;
    return this.menus.save(menu);
  }
}
