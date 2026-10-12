import { ConflictException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { Atributo } from '../../../entities/atributo.entity.js';
import { UpdateAtributoCommand } from './update-atributo.command.js';

@CommandHandler(UpdateAtributoCommand)
export class UpdateAtributoHandler implements ICommandHandler<UpdateAtributoCommand> {
  constructor(
    @InjectRepository(Atributo)
    private readonly atributos: Repository<Atributo>,
  ) {}

  async execute({ id, data }: UpdateAtributoCommand): Promise<Atributo> {
    const atributo = await this.atributos.findOneBy({ id });
    if (!atributo) throw new ResourceNotFoundException('Atributo', id);

    atributo.nombre = data.nombre;
    try {
      return await this.atributos.save(atributo);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23505'
      ) {
        throw new ConflictException('Ya existe un atributo con ese nombre');
      }
      throw error;
    }
  }
}
