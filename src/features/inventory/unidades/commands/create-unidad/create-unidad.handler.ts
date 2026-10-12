import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateUnidaCommand } from './create-unidad.command.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Unidad } from '../../../entities/unidad.entity.js';
import { Repository } from 'typeorm';

@CommandHandler(CreateUnidaCommand)
export class CreateUnidadHandle implements ICommandHandler<CreateUnidaCommand> {
  constructor(
    @InjectRepository(Unidad)
    private readonly unidadRepo: Repository<Unidad>,
  ) {}

  execute(command: CreateUnidaCommand): Promise<Unidad> {
    const { nombre, simbolo, tipo } = command.data;

    const unidad = this.unidadRepo.create({
      nombre,
      simbolo,
      tipo,
    });

    return this.unidadRepo.save(unidad);
  }
}
