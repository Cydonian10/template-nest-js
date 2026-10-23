import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Producto } from '../../inventory/entities/producto.entity.js';
import { Unidad } from '../../inventory/entities/unidad.entity.js';

export enum TipoDescuentoPromocion {
  PORCENTAJE = 'porcentaje',
  MONTO_FIJO = 'monto_fijo',
}

@Entity('promociones')
@Check('CHK_promociones_cantidad_minima', '"cantidad_minima" > 0')
@Check(
  'CHK_promociones_valor',
  '"valor" > 0 AND ("tipo_descuento" <> \'porcentaje\' OR "valor" <= 100)',
)
@Check(
  'CHK_promociones_vigencia',
  '"vigente_hasta" IS NULL OR "vigente_hasta" >= "vigente_desde"',
)
export class Promocion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Producto, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'producto_id' })
  producto: Relation<Producto>;

  @RelationId((promocion: Promocion) => promocion.producto)
  productoId: string;

  @ManyToOne(() => Unidad, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'unidad_id' })
  unidad: Relation<Unidad>;

  @Column({ name: 'cantidad_minima', type: 'numeric', precision: 20, scale: 6 })
  cantidadMinima: string;

  @Column({
    name: 'tipo_descuento',
    type: 'enum',
    enum: TipoDescuentoPromocion,
    enumName: 'tipo_descuento_promocion',
  })
  tipoDescuento: TipoDescuentoPromocion;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  valor: string;

  @Column({ name: 'vigente_desde', type: 'timestamptz' })
  vigenteDesde: Date;

  @Column({ name: 'vigente_hasta', type: 'timestamptz', nullable: true })
  vigenteHasta: Date | null;

  @Column({ default: true })
  activo: boolean;
}
