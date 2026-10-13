import { ConflictException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateUnidaCommand } from './create-unidad.command.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Unidad } from '../../../entities/unidad.entity.js';
import { QueryFailedError, Repository } from 'typeorm';

@CommandHandler(CreateUnidaCommand)
export class CreateUnidadHandle implements ICommandHandler<CreateUnidaCommand> {
  constructor(
    @InjectRepository(Unidad)
    private readonly unidadRepo: Repository<Unidad>,
  ) {}

  async execute(command: CreateUnidaCommand): Promise<Unidad> {
    const { nombre, simbolo, tipo } = command.data;

    const unidad = this.unidadRepo.create({
      nombre,
      simbolo,
      tipo,
    });

    try {
      return await this.unidadRepo.save(unidad);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23505'
      ) {
        throw new ConflictException('Ya existe una unidad con ese nombre');
      }
      throw error;
    }
  }
}
