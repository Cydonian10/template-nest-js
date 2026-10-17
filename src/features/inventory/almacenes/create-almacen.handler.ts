import { ConflictException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Almacen } from '../entities/almacen.entity.js';
import type { CreateAlmacenDto } from './almacenes.dto.js';

export class CreateAlmacenCommand {
  constructor(readonly data: CreateAlmacenDto) {}
}

@CommandHandler(CreateAlmacenCommand)
export class CreateAlmacenHandler implements ICommandHandler<CreateAlmacenCommand> {
  constructor(
    @InjectRepository(Almacen) private readonly almacenes: Repository<Almacen>,
  ) {}

  async execute({ data }: CreateAlmacenCommand): Promise<Almacen> {
    try {
      return await this.almacenes.save(this.almacenes.create(data));
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
