import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { Marca } from '../../../entities/marca.entity.js';
import { CambiarEstadoMarcaCommand } from './cambiar-estado-marca.command.js';

@CommandHandler(CambiarEstadoMarcaCommand)
export class CambiarEstadoMarcaHandler implements ICommandHandler<CambiarEstadoMarcaCommand> {
  constructor(
    @InjectRepository(Marca)
    private readonly marcas: Repository<Marca>,
  ) {}

  async execute({ id, activo }: CambiarEstadoMarcaCommand): Promise<Marca> {
    const result = await this.marcas.update({ id }, { activo });
    if (!result.affected) throw new ResourceNotFoundException('Marca', id);
    return this.marcas.findOneByOrFail({ id });
  }
}
