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
import { VarianteProducto } from '../../inventory/entities/variante-producto.entity.js';
import { Imagen } from './imagen.entity.js';

@Entity('variante_imagenes')
@Unique('UQ_variante_imagenes_variante_imagen', ['variante', 'imagen'])
@Index('IDX_variante_imagenes_variante_id', ['variante'])
@Index('UQ_variante_imagenes_principal', ['variante'], {
  unique: true,
  where: '"es_principal" = true',
})
export class VarianteImagen {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_variante_imagenes',
  })
  id: string;

  @ManyToOne(() => VarianteProducto, (variante) => variante.imagenes, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'variante_id',
    foreignKeyConstraintName: 'FK_variante_imagenes_variante',
  })
  variante: Relation<VarianteProducto>;

  @RelationId((asociacion: VarianteImagen) => asociacion.variante)
  varianteId: string;

  @ManyToOne(() => Imagen, (imagen) => imagen.variantes, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'imagen_id',
    foreignKeyConstraintName: 'FK_variante_imagenes_imagen',
  })
  imagen: Relation<Imagen>;

  @RelationId((asociacion: VarianteImagen) => asociacion.imagen)
  imagenId: string;

  @Column({ type: 'integer', default: 0 })
  orden: number;

  @Column({ name: 'es_principal', default: false })
  esPrincipal: boolean;
}
