import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { Atributo } from '../../../entities/atributo.entity.js';
import { FindAtributoByIdQuery } from './find-atributo-by-id.query.js';

@QueryHandler(FindAtributoByIdQuery)
export class FindAtributoByIdHandler implements IQueryHandler<FindAtributoByIdQuery> {
  constructor(
    @InjectRepository(Atributo)
    private readonly atributos: Repository<Atributo>,
  ) {}

  async execute({ id }: FindAtributoByIdQuery): Promise<Atributo> {
    const atributo = await this.atributos.findOneBy({ id });
    if (!atributo) throw new ResourceNotFoundException('Atributo', id);
    return atributo;
  }
}
