import { ConflictException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { Categoria } from '../../../entities/categoria.entity.js';
import { EditarCategoriaCommand } from './editar-categoria.command.js';

@CommandHandler(EditarCategoriaCommand)
export class EditarCategoriaHandler implements ICommandHandler<EditarCategoriaCommand> {
  constructor(
    @InjectRepository(Categoria)
    private readonly categorias: Repository<Categoria>,
  ) {}

  async execute({ id, data }: EditarCategoriaCommand): Promise<Categoria> {
    const categoria = await this.categorias.findOneBy({ id });
    if (!categoria) throw new ResourceNotFoundException('Categoría', id);

    if (data.nombre !== undefined) categoria.nombre = data.nombre;
    if (data.descripcion !== undefined)
      categoria.descripcion = data.descripcion;
    try {
      return await this.categorias.save(categoria);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23505'
      ) {
        throw new ConflictException('Ya existe una categoría con ese nombre');
      }
      throw error;
    }
  }
}
