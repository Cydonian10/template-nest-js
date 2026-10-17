import { ConflictException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { ResourceNotFoundException } from '../../../shared/exceptions/resource-not-found.exception.js';
import { Almacen } from '../entities/almacen.entity.js';
import type { UpdateAlmacenDto } from './almacenes.dto.js';

export class UpdateAlmacenCommand {
  constructor(
    readonly id: string,
    readonly data: UpdateAlmacenDto,
  ) {}
}

@CommandHandler(UpdateAlmacenCommand)
export class UpdateAlmacenHandler implements ICommandHandler<UpdateAlmacenCommand> {
  constructor(
    @InjectRepository(Almacen) private readonly almacenes: Repository<Almacen>,
  ) {}

  async execute({ id, data }: UpdateAlmacenCommand): Promise<Almacen> {
    const almacen = await this.almacenes.findOneBy({ id });
    if (!almacen) throw new ResourceNotFoundException('Almacén', id);
    Object.assign(almacen, data);
    try {
      return await this.almacenes.save(almacen);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23505'
      ) {
        throw new ConflictException('Ya existe un almacén con ese nombre');
      }
      throw error;
    }
  }
}
