import { ConflictException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QueryFailedError } from 'typeorm';
import { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { Menu } from '../../../entities/menu.entity.js';
import { SystemModule } from '../../../entities/module.entity.js';
import { DeleteModuleCommand } from './delete-module.command.js';

@CommandHandler(DeleteModuleCommand)
export class DeleteModuleHandler implements ICommandHandler<DeleteModuleCommand> {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute({ systemId, id }: DeleteModuleCommand): Promise<void> {
    try {
      await this.unitOfWork.execute(async (manager) => {
        const module = await manager.findOne(SystemModule, {
          where: { id, system: { id: systemId } },
          lock: { mode: 'pessimistic_write' },
        });
        if (!module) throw new ResourceNotFoundException('Módulo', id);
        if (await manager.exists(Menu, { where: { module: { id } } })) {
          throw new ConflictException(
            'No se puede eliminar un módulo que contiene menús',
          );
        }
        await manager.remove(module);
      });
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23503'
      ) {
        throw new ConflictException(
          'No se puede eliminar un módulo que contiene menús',
        );
      }
      throw error;
    }
  }
}
