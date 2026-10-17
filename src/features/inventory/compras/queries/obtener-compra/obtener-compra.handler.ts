import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { Compra } from '../../../entities/compra.entity.js';
import { ObtenerCompraQuery } from './obtener-compra.query.js';

@QueryHandler(ObtenerCompraQuery)
export class ObtenerCompraHandler implements IQueryHandler<ObtenerCompraQuery> {
  constructor(
    @InjectRepository(Compra)
    private readonly compras: Repository<Compra>,
  ) {}

  async execute({ id }: ObtenerCompraQuery): Promise<Compra> {
    const compra = await this.compras.findOne({
      where: { id },
      relations: {
        proveedor: true,
        movimientos: { almacenDestino: true },
        detalles: { variante: { producto: true }, unidad: true },
        comprobantes: true,
      },
    });
    if (!compra) throw new ResourceNotFoundException('Compra', id);
    return compra;
  }
}
