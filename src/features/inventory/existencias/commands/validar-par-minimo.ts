import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceNotFoundException } from '../../../../shared/exceptions/resource-not-found.exception.js';
import { Almacen } from '../../entities/almacen.entity.js';
import { VarianteProducto } from '../../entities/variante-producto.entity.js';

@Injectable()
export class ValidarParMinimo {
  constructor(
    @InjectRepository(VarianteProducto)
    private readonly variantes: Repository<VarianteProducto>,
    @InjectRepository(Almacen)
    private readonly almacenes: Repository<Almacen>,
  ) {}

  async execute(varianteId: string, almacenId: string): Promise<void> {
    const variante = await this.variantes.findOne({
      where: { id: varianteId, activo: true, producto: { activo: true } },
    });
    if (!variante) throw new ResourceNotFoundException('Variante', varianteId);
    const almacen = await this.almacenes.findOneBy({ id: almacenId, activo: true });
    if (!almacen) throw new ResourceNotFoundException('Almacén', almacenId);
  }
}
