import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  RelationId,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Unidad } from './unidad.entity.js';
import { VarianteProducto } from './variante-producto.entity.js';
import { DetalleMovimiento } from './detalle-movimiento.entity.js';
import { Compra } from './compra.entity.js';

@Entity('detalles_compra')
@Check('CHK_detalles_compra_cantidad_positiva', '"cantidad" > 0')
@Check('CHK_detalles_compra_factor_positivo', '"factor_a_base" > 0')
@Check('CHK_detalles_compra_precio_no_negativo', '"precio_unitario" >= 0')
export class DetalleCompra {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Compra, (compra) => compra.detalles, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'compra_id' })
  compra: Relation<Compra>;

  @RelationId((detalle: DetalleCompra) => detalle.compra)
  compraId: string;

  @ManyToOne(() => VarianteProducto, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'variante_id' })
  variante: Relation<VarianteProducto>;

  @RelationId((detalle: DetalleCompra) => detalle.variante)
  varianteId: string;

  @ManyToOne(() => Unidad, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'unidad_id' })
  unidad: Relation<Unidad>;

  @RelationId((detalle: DetalleCompra) => detalle.unidad)
  unidadId: string;

  @Column({ type: 'numeric', precision: 20, scale: 6 })
  cantidad: string;

  // Copia de la equivalencia acordada al registrar la compra.
  @Column({ name: 'factor_a_base', type: 'numeric', precision: 20, scale: 8 })
  factorABase: string;

  @Column({ name: 'precio_unitario', type: 'numeric', precision: 20, scale: 6 })
  precioUnitario: string;

  @OneToMany(() => DetalleMovimiento, (movimiento) => movimiento.detalleCompra)
  detallesMovimiento: Relation<DetalleMovimiento[]>;
}
