import {
  Check,
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  RelationId,
  Unique,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Imagen } from '../../images/entities/imagen.entity.js';
import { Producto } from './producto.entity.js';

@Entity('marcas')
@Check('CHK_marcas_nombre', 'length(btrim("nombre")) BETWEEN 1 AND 200')
@Unique('UQ_marcas_imagen_id', ['imagen'])
export class Marca {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_marcas' })
  id: string;

  @Column({ length: 200 })
  nombre: string;

  @Column({ default: true })
  activo: boolean;

  @OneToOne(() => Imagen, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'imagen_id',
    foreignKeyConstraintName: 'FK_marcas_imagen',
  })
  imagen: Relation<Imagen> | null;

  @RelationId((marca: Marca) => marca.imagen)
  imagenId: string | null;

  @OneToMany(() => Producto, (producto) => producto.marca)
  productos: Relation<Producto[]>;
}
