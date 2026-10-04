import { ConflictException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QueryFailedError } from 'typeorm';
import { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { System } from '../../../entities/system.entity.js';
import { Permission } from '../../../entities/permission.entity.js';
import { RoleSystem } from '../../../entities/role_system.entity.js';
import { DeleteSystemCommand } from './delete-system.command.js';

@CommandHandler(DeleteSystemCommand)
export class DeleteSystemHandler implements ICommandHandler<DeleteSystemCommand> {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute({ id }: DeleteSystemCommand): Promise<void> {
    try {
      await this.unitOfWork.execute(async (manager) => {
        const system = await manager.findOne(System, {
          where: { id },
          lock: { mode: 'pessimistic_write' },
        });
        if (!system) throw new ResourceNotFoundException('Sistema', id);

        if (
          (await manager.exists(Permission, { where: { system: { id } } })) ||
          (await manager.exists(RoleSystem, { where: { system: { id } } }))
        ) {
          throw new ConflictException(
            'No se puede eliminar un sistema con permisos o roles',
          );
        }
        await manager.remove(system);
      });
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23503'
      ) {
        throw new ConflictException(
          'No se puede eliminar un sistema con permisos o roles',
        );
      }
      throw error;
    }
  }
}
