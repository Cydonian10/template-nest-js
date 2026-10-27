import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MinimoExistencia } from '../../../entities/minimo-existencia.entity.js';
import { ValidarParMinimo } from '../validar-par-minimo.js';
import { QuitarMinimoCommand } from './quitar-minimo.command.js';

@CommandHandler(QuitarMinimoCommand)
export class QuitarMinimoHandler implements ICommandHandler<QuitarMinimoCommand> {
  constructor(
    @InjectRepository(MinimoExistencia)
    private readonly minimos: Repository<MinimoExistencia>,
    private readonly validarPar: ValidarParMinimo,
  ) {}

  async execute({ varianteId, almacenId }: QuitarMinimoCommand): Promise<void> {
    await this.validarPar.execute(varianteId, almacenId);
    await this.minimos.delete({ varianteId, almacenId });
  }
}
