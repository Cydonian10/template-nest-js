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
import { Unidad } from './unidad.entity.js';
import { UnidadProducto } from './unidad-producto.entity.js';
import { AtributoProducto } from './atributo-producto.entity.js';
import { VarianteProducto } from './variante-producto.entity.js';

@Entity('productos')
export class Producto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @ManyToOne(() => Unidad, (unidad) => unidad.productosBase, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'unidad_base_id' })
  unidadBase: Relation<Unidad>;

  @RelationId((producto: Producto) => producto.unidadBase)
  unidadBaseId: string;

  @Column({ default: true })
  activo: boolean;

  @OneToMany(() => UnidadProducto, (unidadProducto) => unidadProducto.producto)
  unidades: Relation<UnidadProducto[]>;

  @OneToMany(
    () => AtributoProducto,
    (atributoProducto) => atributoProducto.producto,
  )
  atributos: Relation<AtributoProducto[]>;

  @OneToMany(() => VarianteProducto, (variante) => variante.producto)
  variantes: Relation<VarianteProducto[]>;
}
