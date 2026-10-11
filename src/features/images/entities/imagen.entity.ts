import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { ProductoImagen } from './producto-imagen.entity.js';
import { VarianteImagen } from './variante-imagen.entity.js';

@Entity('imagenes')
@Check('CHK_imagenes_tamano_positivo', '"tamano_bytes" > 0')
@Unique('UQ_imagenes_clave_almacenamiento', ['claveAlmacenamiento'])
export class Imagen {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_imagenes' })
  id: string;

  @Column({ name: 'clave_almacenamiento', length: 500 })
  claveAlmacenamiento: string;

  @Column({ name: 'proveedor', length: 50 })
  proveedor: string;

  @Column({ name: 'tipo_mime', length: 100 })
  tipoMime: string;

  @Column({ name: 'tamano_bytes', type: 'integer' })
  tamanoBytes: number;

  @Column({ name: 'nombre_original', length: 255 })
  nombreOriginal: string;

  @CreateDateColumn({ name: 'fecha_subida', type: 'timestamptz' })
  fechaSubida: Date;

  @OneToMany(() => ProductoImagen, (asociacion) => asociacion.imagen)
  productos: Relation<ProductoImagen[]>;

  @OneToMany(() => VarianteImagen, (asociacion) => asociacion.imagen)
  variantes: Relation<VarianteImagen[]>;
}
