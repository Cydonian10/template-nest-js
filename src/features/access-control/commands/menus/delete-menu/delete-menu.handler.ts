import { ConflictException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QueryFailedError } from 'typeorm';
import { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { Menu } from '../../../entities/menu.entity.js';
import { RoleMenu } from '../../../entities/role_menu.entity.js';
import { DeleteMenuCommand } from './delete-menu.command.js';

@CommandHandler(DeleteMenuCommand)
export class DeleteMenuHandler implements ICommandHandler<DeleteMenuCommand> {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute({ id }: DeleteMenuCommand): Promise<void> {
    try {
      await this.unitOfWork.execute(async (manager) => {
        const menu = await manager.findOne(Menu, {
          where: { id },
          lock: { mode: 'pessimistic_write' },
        });
        if (!menu) throw new ResourceNotFoundException('Menú', id);
        if (await manager.exists(RoleMenu, { where: { menu: { id } } })) {
          throw new ConflictException(
            'No se puede eliminar un menú asociado a roles',
          );
        }
        await manager.remove(menu);
      });
    } catch (error) {
      // La FK RESTRICT también protege frente a asignaciones concurrentes.
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23503'
      ) {
        throw new ConflictException(
          'No se puede eliminar un menú asociado a roles',
        );
      }
      throw error;
    }
  }
}
