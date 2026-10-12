import { ConflictException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Atributo } from '../../../entities/atributo.entity.js';
import { CreateAtributoCommand } from './create-atributo.command.js';

@CommandHandler(CreateAtributoCommand)
export class CreateAtributoHandler implements ICommandHandler<CreateAtributoCommand> {
  constructor(
    @InjectRepository(Atributo)
    private readonly atributos: Repository<Atributo>,
  ) {}

  async execute({ data }: CreateAtributoCommand): Promise<Atributo> {
    try {
      return await this.atributos.save(this.atributos.create(data));
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
