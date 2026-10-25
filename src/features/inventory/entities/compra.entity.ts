import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  RelationId,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { User } from '../../access-control/entities/user.entity.js';
import { Proveedor } from './proveedor.entity.js';
import { MovimientoInventario } from './movimiento-inventario.entity.js';
import { DetalleCompra } from './detalle-compra.entity.js';
import { ComprobanteCompra } from './comprobante-compra.entity.js';

@Entity('compras')
@Check(
  'CHK_compras_total_no_negativo',
  '"total_documento" IS NULL OR "total_documento" >= 0',
)
@Check(
  'CHK_compras_tipo_documento',
  "\"tipo_documento\" IS NULL OR \"tipo_documento\" IN ('factura', 'boleta', 'otro')",
)
@Index(
  'UQ_compras_proveedor_tipo_serie_numero',
  ['proveedor', 'tipoDocumento', 'serieDocumento', 'numeroDocumento'],
  {
    unique: true,
    where:
      '"tipo_documento" IS NOT NULL AND "serie_documento" IS NOT NULL AND "numero_documento" IS NOT NULL',
  },
)
export class Compra {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Proveedor, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'proveedor_id' })
  proveedor: Relation<Proveedor>;

  @RelationId((compra: Compra) => compra.proveedor)
  proveedorId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Relation<User>;

  @RelationId((compra: Compra) => compra.usuario)
  usuarioId: string;

  // Fecha del documento; la recepción de mercancía tiene su propia fecha.
  @Column({ type: 'date' })
  fecha: string;

  // Los registros anteriores a este flujo pueden no tener tipo ni serie.
  @Column({
    name: 'tipo_documento',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  tipoDocumento: 'factura' | 'boleta' | 'otro' | null;

  @Column({
    name: 'serie_documento',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  serieDocumento: string | null;

  @Column({
    name: 'numero_documento',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  numeroDocumento: string | null;

  @Column({
    name: 'total_documento',
    type: 'numeric',
    precision: 38,
    scale: 6,
    nullable: true,
  })
  totalDocumento: string | null;

  @Column({ type: 'text', nullable: true })
  observaciones: string | null;

  @CreateDateColumn({ name: 'fecha_registro', type: 'timestamptz' })
  fechaRegistro: Date;

  @Column({ type: 'integer', default: 0 })
  revision: number;

  @OneToMany(() => DetalleCompra, (detalle) => detalle.compra)
  detalles: Relation<DetalleCompra[]>;

  @OneToMany(() => ComprobanteCompra, (comprobante) => comprobante.compra)
  comprobantes: Relation<ComprobanteCompra[]>;

  // Una compra puede recibirse en uno o varios ingresos de inventario.
  @OneToMany(() => MovimientoInventario, (movimiento) => movimiento.compra)
  movimientos: Relation<MovimientoInventario[]>;
}
