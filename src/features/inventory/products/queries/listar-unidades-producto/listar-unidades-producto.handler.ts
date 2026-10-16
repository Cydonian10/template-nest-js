import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { Producto } from '../../../entities/producto.entity.js';
import { UnidadProducto } from '../../../entities/unidad-producto.entity.js';
import { AgregarUnidadProductoResponseDto } from '../../dto/agregar-unidad-producto-response.dto.js';
import { ListarUnidadesProductoQuery } from './listar-unidades-producto.query.js';

@QueryHandler(ListarUnidadesProductoQuery)
export class ListarUnidadesProductoHandler implements IQueryHandler<ListarUnidadesProductoQuery> {
  constructor(
    @InjectRepository(Producto)
    private readonly productos: Repository<Producto>,
    @InjectRepository(UnidadProducto)
    private readonly unidadesProducto: Repository<UnidadProducto>,
  ) {}

  async execute({
    productoId,
  }: ListarUnidadesProductoQuery): Promise<AgregarUnidadProductoResponseDto[]> {
    if (!(await this.productos.existsBy({ id: productoId }))) {
      throw new ResourceNotFoundException('Producto', productoId);
    }
    const asignaciones = await this.unidadesProducto.find({
      where: { producto: { id: productoId } },
      relations: { producto: true, unidad: true },
      order: { unidad: { nombre: 'ASC' }, id: 'ASC' },
    });
    return asignaciones.map(AgregarUnidadProductoResponseDto.from);
  }
}
