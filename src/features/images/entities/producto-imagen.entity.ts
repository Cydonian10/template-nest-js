import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
  Unique,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Producto } from '../../inventory/entities/producto.entity.js';
import { Imagen } from './imagen.entity.js';

@Entity('producto_imagenes')
@Unique('UQ_producto_imagenes_producto_imagen', ['producto', 'imagen'])
@Index('IDX_producto_imagenes_producto_id', ['producto'])
@Index('UQ_producto_imagenes_principal', ['producto'], {
  unique: true,
  where: '"es_principal" = true',
})
export class ProductoImagen {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_producto_imagenes',
  })
  id: string;

  @ManyToOne(() => Producto, (producto) => producto.imagenes, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'producto_id',
    foreignKeyConstraintName: 'FK_producto_imagenes_producto',
  })
  producto: Relation<Producto>;

  @RelationId((asociacion: ProductoImagen) => asociacion.producto)
  productoId: string;

  @ManyToOne(() => Imagen, (imagen) => imagen.productos, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'imagen_id',
    foreignKeyConstraintName: 'FK_producto_imagenes_imagen',
  })
  imagen: Relation<Imagen>;

  @RelationId((asociacion: ProductoImagen) => asociacion.imagen)
  imagenId: string;

  @Column({ type: 'integer', default: 0 })
  orden: number;

  @Column({ name: 'es_principal', default: false })
  esPrincipal: boolean;
}
