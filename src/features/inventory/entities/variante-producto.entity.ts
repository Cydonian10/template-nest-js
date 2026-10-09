import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  RelationId,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Producto } from './producto.entity.js';
import { ValorVariante } from './valor-variante.entity.js';
import { Existencia } from './existencia.entity.js';
import { DetalleMovimiento } from './detalle-movimiento.entity.js';

@Entity('variantes_producto')
export class VarianteProducto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Producto, (producto) => producto.variantes, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'producto_id' })
  producto: Relation<Producto>;

  @RelationId((variante: VarianteProducto) => variante.producto)
  productoId: string;

  @Column({ length: 100, unique: true })
  sku: string;

  @Column({ name: 'codigo_barras', type: 'varchar', length: 100, nullable: true, unique: true })
  codigoBarras: string | null;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  precio: string;

  @Column({ default: true })
  activo: boolean;

  @OneToMany(() => ValorVariante, (valor) => valor.variante)
  valores: Relation<ValorVariante[]>;

  @OneToMany(() => Existencia, (existencia) => existencia.variante)
  existencias: Relation<Existencia[]>;

  @OneToMany(() => DetalleMovimiento, (detalle) => detalle.variante)
  detallesMovimiento: Relation<DetalleMovimiento[]>;
}
