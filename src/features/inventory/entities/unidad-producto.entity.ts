import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
  Unique,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Producto } from './producto.entity.js';
import { Unidad } from './unidad.entity.js';

@Entity('unidades_producto')
@Unique('UQ_unidades_producto_producto_unidad', ['producto', 'unidad'])
@Check('CHK_unidades_producto_factor_positivo', '"factor_a_base" > 0')
export class UnidadProducto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Producto, (producto) => producto.unidades, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'producto_id' })
  producto: Relation<Producto>;

  @RelationId((unidadProducto: UnidadProducto) => unidadProducto.producto)
  productoId: string;

  @ManyToOne(() => Unidad, (unidad) => unidad.unidadesProducto, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'unidad_id' })
  unidad: Relation<Unidad>;

  @RelationId((unidadProducto: UnidadProducto) => unidadProducto.unidad)
  unidadId: string;

  // Decimal de PostgreSQL: string evita pérdidas de precisión en JavaScript.
  @Column({ name: 'factor_a_base', type: 'numeric', precision: 20, scale: 8 })
  factorABase: string;
}
