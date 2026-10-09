import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { AtributoProducto } from './atributo-producto.entity.js';
import { ValorVariante } from './valor-variante.entity.js';

@Entity('atributos')
export class Atributo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, unique: true })
  nombre: string;

  @OneToMany(
    () => AtributoProducto,
    (atributoProducto) => atributoProducto.atributo,
  )
  productos: Relation<AtributoProducto[]>;

  @OneToMany(() => ValorVariante, (valor) => valor.atributo)
  valores: Relation<ValorVariante[]>;
}
