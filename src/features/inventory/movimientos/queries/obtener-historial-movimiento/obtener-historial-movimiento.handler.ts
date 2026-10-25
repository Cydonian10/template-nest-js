import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import {
  EstadoMovimientoInventario,
  MovimientoInventario,
} from '../../../entities/movimiento-inventario.entity.js';
import { ObtenerHistorialMovimientoQuery } from './obtener-historial-movimiento.query.js';

@QueryHandler(ObtenerHistorialMovimientoQuery)
export class ObtenerHistorialMovimientoHandler
  implements IQueryHandler<ObtenerHistorialMovimientoQuery>
{
  constructor(
    @InjectRepository(MovimientoInventario)
    private readonly movimientos: Repository<MovimientoInventario>,
  ) {}

  async execute({ id }: ObtenerHistorialMovimientoQuery): Promise<MovimientoInventario> {
    const movimiento = await this.movimientos.findOne({
      where: { id, estado: EstadoMovimientoInventario.CONFIRMADO },
      relations: {
        usuario: true,
        compra: true,
        almacenOrigen: true,
        almacenDestino: true,
        detalles: { variante: { producto: true }, unidad: true },
      },
      order: { detalles: { id: 'ASC' } },
    });
    if (!movimiento) throw new ResourceNotFoundException('Movimiento', id);
    return movimiento;
  }
}
