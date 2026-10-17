import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Compra } from '../../../entities/compra.entity.js';
import { ListarComprasQuery } from './listar-compras.query.js';

@QueryHandler(ListarComprasQuery)
export class ListarComprasHandler implements IQueryHandler<ListarComprasQuery> {
  constructor(
    @InjectRepository(Compra)
    private readonly compras: Repository<Compra>,
  ) {}

  execute({ filter }: ListarComprasQuery): Promise<[Compra[], number]> {
    const escaped = filter.q?.replace(/[\\%_]/g, '\\$&');
    const text = escaped ? ILike(`%${escaped}%`) : undefined;
    return this.compras.findAndCount({
      where: text
        ? [
            { proveedor: { nombre: text } },
            { serieDocumento: text },
            { numeroDocumento: text },
          ]
        : {},
      relations: {
        proveedor: true,
        movimientos: { almacenDestino: true },
        detalles: true,
      },
      order: { fechaRegistro: 'DESC', id: 'DESC' },
      skip: (filter.page - 1) * filter.limit,
      take: filter.limit,
    });
  }
}
