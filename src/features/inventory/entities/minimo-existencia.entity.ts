import { Check, Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { Almacen } from './almacen.entity.js';
import { VarianteProducto } from './variante-producto.entity.js';

@Entity('minimos_existencia')
@Check('CHK_minimos_existencia_positivo', '"minimo_base" > 0')
export class MinimoExistencia {
  @PrimaryColumn({ name: 'variante_id', type: 'uuid' })
  varianteId: string;

  @ManyToOne(() => VarianteProducto, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'variante_id' })
  variante: Relation<VarianteProducto>;

  @PrimaryColumn({ name: 'almacen_id', type: 'uuid' })
  almacenId: string;

  @ManyToOne(() => Almacen, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'almacen_id' })
  almacen: Relation<Almacen>;

  @Column({ name: 'minimo_base', type: 'numeric', precision: 24, scale: 6 })
  minimoBase: string;
}
