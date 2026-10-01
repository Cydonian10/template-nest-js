import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { Menu } from '../../../entities/menu.entity.js';
import { SystemModule } from '../../../entities/module.entity.js';
import { Role } from '../../../entities/roles.entity.js';
import { FindAllMenusQuery } from './find-all-menus.query.js';

@QueryHandler(FindAllMenusQuery)
export class FindAllMenusHandler implements IQueryHandler<FindAllMenusQuery> {
  constructor(
    @InjectRepository(Menu) private readonly menus: Repository<Menu>,
    @InjectRepository(SystemModule)
    private readonly modules: Repository<SystemModule>,
    @InjectRepository(Role) private readonly roles: Repository<Role>,
  ) {}

  async execute({
    moduleId,
    roleId,
    systemId,
  }: FindAllMenusQuery): Promise<Menu[]> {
    if (
      moduleId &&
      !(await this.modules.existsBy({
        id: moduleId,
        ...(systemId ? { system: { id: systemId } } : {}),
      }))
    ) {
      throw new ResourceNotFoundException('Módulo', moduleId);
    }
    if (roleId && !(await this.roles.existsBy({ id: roleId }))) {
      throw new ResourceNotFoundException('Rol', roleId);
    }
    if (!moduleId && !roleId)
      return this.menus.find({
        order: { order: 'ASC', name: 'ASC', id: 'ASC' },
      });

    const query = this.menus.createQueryBuilder('menu');
    if (roleId) {
      query
        .innerJoin('menu.roleMenus', 'assignment')
        .andWhere('assignment.role_id = :roleId', { roleId });
    }
    if (moduleId) query.andWhere('menu.module_id = :moduleId', { moduleId });
    return query
      .distinct(true)
      .orderBy('menu.order', 'ASC')
      .addOrderBy('menu.name', 'ASC')
      .addOrderBy('menu.id', 'ASC')
      .getMany();
  }
}
