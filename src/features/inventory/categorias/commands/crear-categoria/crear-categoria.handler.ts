import { ConflictException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Categoria } from '../../../entities/categoria.entity.js';
import { CrearCategoriaCommand } from './crear-categoria.command.js';

@CommandHandler(CrearCategoriaCommand)
export class CrearCategoriaHandler implements ICommandHandler<CrearCategoriaCommand> {
  constructor(
    @InjectRepository(Categoria)
    private readonly categorias: Repository<Categoria>,
  ) {}

  async execute({ data }: CrearCategoriaCommand): Promise<Categoria> {
    try {
      return await this.categorias.save(
        this.categorias.create({
          ...data,
          descripcion: data.descripcion ?? null,
        }),
      );
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
