import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { PaginatedResponseDto } from '../../../../../shared/pagination/paginated-response.dto.js';
import { Compra } from '../../../entities/compra.entity.js';
import { Proveedor } from '../../../entities/proveedor.entity.js';
import {
  CompraProveedorResumenDto,
  InformeComprasProveedorDto,
} from '../../dto/informe-compras-proveedor.dto.js';
import { ProveedorResponseDto } from '../../dto/proveedores.dto.js';
import { ListarComprasProveedorQuery } from './listar-compras-proveedor.query.js';

@QueryHandler(ListarComprasProveedorQuery)
export class ListarComprasProveedorHandler implements IQueryHandler<ListarComprasProveedorQuery> {
  constructor(
    @InjectRepository(Compra)
    private readonly compras: Repository<Compra>,
  ) {}

  async execute({
    id,
    filter,
  }: ListarComprasProveedorQuery): Promise<InformeComprasProveedorDto> {
    // Identidad, agregado y página pertenecen al mismo snapshot.
    return this.compras.manager.transaction(
      'REPEATABLE READ',
      async (manager) => {
        const proveedor = await manager
          .getRepository(Proveedor)
          .findOneBy({ id });
        if (!proveedor) throw new ResourceNotFoundException('Proveedor', id);

        const compras = manager.getRepository(Compra);
        const filtradas = compras
          .createQueryBuilder('compra')
          .where('compra.proveedor_id = :id', { id });
        if (filter.desde) {
          filtradas.andWhere('compra.fecha >= :desde', { desde: filter.desde });
        }
        if (filter.hasta) {
          filtradas.andWhere('compra.fecha <= :hasta', { hasta: filter.hasta });
        }

        // COUNT(monto) excluye NULL; si difiere de COUNT(*), la suma no es un total conocido.
        const agregado = await filtradas
          .clone()
          .select('COUNT(*)', 'cantidadCompras')
          .addSelect(
            'CASE WHEN COUNT(*) = COUNT(compra.totalDocumento) THEN COALESCE(SUM(compra.totalDocumento), 0)::text ELSE NULL END',
            'totalDocumento',
          )
          .getRawOne<{
            cantidadCompras: string;
            totalDocumento: string | null;
          }>();
        const cantidadCompras = Number(agregado?.cantidadCompras ?? 0);
        const pagina = await filtradas
          .clone()
          .orderBy('compra.fecha', 'DESC')
          .addOrderBy('compra.id', 'DESC')
          .skip((filter.page - 1) * filter.limit)
          .take(filter.limit)
          .getMany();

        const respuesta = PaginatedResponseDto.from(
          pagina.map(CompraProveedorResumenDto.from),
          cantidadCompras,
          filter,
        );
        return {
          proveedor: ProveedorResponseDto.from(proveedor),
          resumen: {
            cantidadCompras,
            totalDocumento:
              agregado?.totalDocumento ?? (cantidadCompras === 0 ? '0' : null),
          },
          ...respuesta,
        };
      },
    );
  }
}
