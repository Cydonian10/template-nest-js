import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MinimoExistencia } from '../../../entities/minimo-existencia.entity.js';
import { ValidarParMinimo } from '../validar-par-minimo.js';
import { GuardarMinimoCommand } from './guardar-minimo.command.js';

@CommandHandler(GuardarMinimoCommand)
export class GuardarMinimoHandler implements ICommandHandler<GuardarMinimoCommand> {
  constructor(
    @InjectRepository(MinimoExistencia)
    private readonly minimos: Repository<MinimoExistencia>,
    private readonly validarPar: ValidarParMinimo,
  ) {}

  async execute(command: GuardarMinimoCommand): Promise<void> {
    const { varianteId, almacenId, minimoBase } = command;
    await this.validarPar.execute(varianteId, almacenId);
    await this.minimos.upsert(
      { varianteId, almacenId, minimoBase },
      ['varianteId', 'almacenId'],
    );
  }
}
