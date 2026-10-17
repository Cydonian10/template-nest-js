import { NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComprobanteCompra } from '../../../entities/comprobante-compra.entity.js';
import { ComprobanteStorage } from '../../storage/comprobante-storage.js';

export class DescargarComprobanteQuery {
  constructor(readonly compraId: string) {}
}

export interface ArchivoComprobante {
  buffer: Buffer;
  mime: string;
  nombre: string;
}

@QueryHandler(DescargarComprobanteQuery)
export class DescargarComprobanteHandler implements IQueryHandler<DescargarComprobanteQuery> {
  constructor(
    @InjectRepository(ComprobanteCompra)
    private readonly comprobantes: Repository<ComprobanteCompra>,
    private readonly storage: ComprobanteStorage,
  ) {}

  async execute({
    compraId,
  }: DescargarComprobanteQuery): Promise<ArchivoComprobante> {
    const comprobante = await this.comprobantes.findOne({
      where: { compra: { id: compraId } },
    });
    if (!comprobante) {
      throw new NotFoundException('Comprobante no encontrado');
    }

    const buffer = await this.storage.read(comprobante.claveAlmacenamiento);
    return {
      buffer,
      mime: comprobante.tipoMime,
      nombre: comprobante.nombreOriginal,
    };
  }
}
