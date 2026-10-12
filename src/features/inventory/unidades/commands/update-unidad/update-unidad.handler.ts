import { ConflictException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { Unidad } from '../../../entities/unidad.entity.js';
import { UpdateUnidadCommand } from './update-unidad.command.js';

@CommandHandler(UpdateUnidadCommand)
export class UpdateUnidadHandler implements ICommandHandler<UpdateUnidadCommand> {
  constructor(
    @InjectRepository(Unidad)
    private readonly unidades: Repository<Unidad>,
  ) {}

  async execute({ id, data }: UpdateUnidadCommand): Promise<Unidad> {
    const unidad = await this.unidades.findOneBy({ id });
    if (!unidad) throw new ResourceNotFoundException('Unidad', id);

    if (data.nombre !== undefined) unidad.nombre = data.nombre;
    if (data.simbolo !== undefined) unidad.simbolo = data.simbolo;
    if (data.tipo !== undefined) unidad.tipo = data.tipo;

    try {
      return await this.unidades.save(unidad);
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
