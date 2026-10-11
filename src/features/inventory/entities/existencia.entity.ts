import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { VarianteProducto } from './variante-producto.entity.js';
import { Almacen } from './almacen.entity.js';

@Entity('existencias')
@Check('CHK_existencias_cantidad_no_negativa', '"cantidad" >= 0')
@Check('CHK_existencias_valor_costo_no_negativo', '"valor_costo" >= 0')
@Check(
  'CHK_existencias_sin_valor_si_vacia',
  '"cantidad" <> 0 OR "valor_costo" = 0',
)
export class Existencia {
  @PrimaryColumn({ name: 'variante_id', type: 'uuid' })
  varianteId: string;

  @ManyToOne(() => VarianteProducto, (variante) => variante.existencias, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'variante_id' })
  variante: Relation<VarianteProducto>;

  @PrimaryColumn({ name: 'almacen_id', type: 'uuid' })
  almacenId: string;

  @ManyToOne(() => Almacen, (almacen) => almacen.existencias, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'almacen_id' })
  almacen: Relation<Almacen>;

  // Siempre en la unidad base del producto.
  @Column({ type: 'numeric', precision: 24, scale: 6, default: 0 })
  cantidad: string;

  // Valor del saldo por variante y almacén; promedio = valorCosto / cantidad.
  @Column({
    name: 'valor_costo',
    type: 'numeric',
    precision: 38,
    scale: 6,
    default: 0,
  })
  valorCosto: string;
}
