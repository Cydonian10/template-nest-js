import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { Producto } from './producto.entity.js';
import { Atributo } from './atributo.entity.js';

@Entity('atributos_producto')
export class AtributoProducto {
  @PrimaryColumn({ name: 'producto_id', type: 'uuid' })
  productoId: string;

  @ManyToOne(() => Producto, (producto) => producto.atributos, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'producto_id' })
  producto: Relation<Producto>;

  @PrimaryColumn({ name: 'atributo_id', type: 'uuid' })
  atributoId: string;

  @ManyToOne(() => Atributo, (atributo) => atributo.productos, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'atributo_id' })
  atributo: Relation<Atributo>;
}
