import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { Producto } from '../../../entities/producto.entity.js';
import { VarianteProducto } from '../../../entities/variante-producto.entity.js';
import { VarianteResponseDto } from '../../dto/variante-response.dto.js';
import { ListarVariantesQuery } from './listar-variantes.query.js';

@QueryHandler(ListarVariantesQuery)
export class ListarVariantesHandler implements IQueryHandler<ListarVariantesQuery> {
  constructor(
    @InjectRepository(Producto)
    private readonly productos: Repository<Producto>,
    @InjectRepository(VarianteProducto)
    private readonly variantes: Repository<VarianteProducto>,
  ) {}

  async execute({
    productoId,
  }: ListarVariantesQuery): Promise<VarianteResponseDto[]> {
    if (!(await this.productos.existsBy({ id: productoId }))) {
      throw new ResourceNotFoundException('Producto', productoId);
    }
    const variantes = await this.variantes.find({
      where: { producto: { id: productoId } },
      relations: { producto: true, valores: true, imagenes: true },
      order: { sku: 'ASC' },
    });
    return variantes.map((variante) => VarianteResponseDto.from(variante));
  }
}
