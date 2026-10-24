import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  RelationId,
  Index,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Unidad } from './unidad.entity.js';
import { UnidadProducto } from './unidad-producto.entity.js';
import { AtributoProducto } from './atributo-producto.entity.js';
import { VarianteProducto } from './variante-producto.entity.js';
import { ProductoImagen } from '../../images/entities/producto-imagen.entity.js';
import { Marca } from './marca.entity.js';
import { Categoria } from './categoria.entity.js';

@Entity('productos')
@Index('IDX_productos_marca_id', ['marca'])
export class Producto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @ManyToOne(() => Marca, (marca) => marca.productos, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'marca_id',
    foreignKeyConstraintName: 'FK_productos_marca',
  })
  marca: Relation<Marca>;

  @RelationId((producto: Producto) => producto.marca)
  marcaId: string;

  @ManyToMany(() => Categoria, (categoria) => categoria.productos)
  @JoinTable({
    name: 'productos_categorias',
    joinColumn: {
      name: 'producto_id',
      referencedColumnName: 'id',
      foreignKeyConstraintName: 'FK_productos_categorias_producto',
    },
    inverseJoinColumn: {
      name: 'categoria_id',
      referencedColumnName: 'id',
      foreignKeyConstraintName: 'FK_productos_categorias_categoria',
    },
  })
  categorias: Relation<Categoria[]>;

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

  @OneToMany(() => ProductoImagen, (asociacion) => asociacion.producto)
  imagenes: Relation<ProductoImagen[]>;
}
