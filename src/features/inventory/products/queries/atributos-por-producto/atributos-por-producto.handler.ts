import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { AtributoProducto } from '../../../entities/atributo-producto.entity.js';
import { Atributo } from '../../../entities/atributo.entity.js';
import { Producto } from '../../../entities/producto.entity.js';
import { AtributoPorProductoResponseDto } from '../../dto/atributo-por-producto-response.dto.js';
import { AtributoPorProductoQuery } from './atributos-por-producto.query.js';

@QueryHandler(AtributoPorProductoQuery)
export class AtributosPorProductoHandler implements IQueryHandler<AtributoPorProductoQuery> {
  constructor(
    @InjectRepository(Producto)
    private readonly productos: Repository<Producto>,
    @InjectRepository(Atributo)
    private readonly atributos: Repository<Atributo>,
    @InjectRepository(AtributoProducto)
    private readonly atributosProducto: Repository<AtributoProducto>,
  ) {}

  async execute({
    data: { productoId },
  }: AtributoPorProductoQuery): Promise<AtributoPorProductoResponseDto[]> {
    if (!(await this.productos.existsBy({ id: productoId }))) {
      throw new ResourceNotFoundException('Producto', productoId);
    }

    const [atributos, asignaciones] = await Promise.all([
      this.atributos.find({ order: { nombre: 'ASC', id: 'ASC' } }),
      this.atributosProducto.find({
        where: { productoId },
        select: { atributoId: true },
      }),
    ]);
    const asignados = new Set(asignaciones.map(({ atributoId }) => atributoId));

    return atributos.map((atributo) =>
      AtributoPorProductoResponseDto.from(
        atributo,
        asignados.has(atributo.id) ? productoId : null,
      ),
    );
  }
}
