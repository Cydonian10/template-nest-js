import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Compra } from './compra.entity.js';

@Entity('comprobantes_compra')
@Check('CHK_comprobantes_compra_tamano_positivo', '"tamano_bytes" > 0')
export class ComprobanteCompra {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Compra, (compra) => compra.comprobantes, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'compra_id' })
  compra: Relation<Compra>;

  @RelationId((comprobante: ComprobanteCompra) => comprobante.compra)
  compraId: string;

  @Column({ name: 'nombre_original', type: 'varchar', length: 255 })
  nombreOriginal: string;

  @Column({ name: 'tipo_mime', type: 'varchar', length: 100 })
  tipoMime: string;

  @Column({ name: 'tamano_bytes', type: 'integer' })
  tamanoBytes: number;

  // Clave privada del archivo en el almacenamiento, no una URL pública.
  @Column({
    name: 'clave_almacenamiento',
    type: 'varchar',
    length: 500,
    unique: true,
  })
  claveAlmacenamiento: string;

  @CreateDateColumn({ name: 'fecha_subida', type: 'timestamptz' })
  fechaSubida: Date;
}
