import {
  Check,
  Column,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Producto } from './producto.entity.js';

@Entity('categorias')
@Check('CHK_categorias_nombre', 'length(btrim("nombre")) BETWEEN 1 AND 200')
export class Categoria {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_categorias' })
  id: string;

  @Column({ length: 200 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ default: true })
  activo: boolean;

  @ManyToMany(() => Producto, (producto) => producto.categorias)
  productos: Relation<Producto[]>;
}
