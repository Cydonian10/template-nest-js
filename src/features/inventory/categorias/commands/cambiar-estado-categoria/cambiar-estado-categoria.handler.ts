import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { Categoria } from '../../../entities/categoria.entity.js';
import { CambiarEstadoCategoriaCommand } from './cambiar-estado-categoria.command.js';

@CommandHandler(CambiarEstadoCategoriaCommand)
export class CambiarEstadoCategoriaHandler implements ICommandHandler<CambiarEstadoCategoriaCommand> {
  constructor(
    @InjectRepository(Categoria)
    private readonly categorias: Repository<Categoria>,
  ) {}

  async execute({
    id,
    activo,
  }: CambiarEstadoCategoriaCommand): Promise<Categoria> {
    const result = await this.categorias.update({ id }, { activo });
    if (!result.affected) throw new ResourceNotFoundException('Categoría', id);
    return this.categorias.findOneByOrFail({ id });
  }
}
