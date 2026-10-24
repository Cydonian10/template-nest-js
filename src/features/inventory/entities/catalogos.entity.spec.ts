import { getMetadataArgsStorage } from 'typeorm';
import { Producto } from './producto.entity.js';
import { Marca } from './marca.entity.js';
import { Categoria } from './categoria.entity.js';

describe('relaciones de productos con catálogos', () => {
  it('registra las entidades y el vínculo obligatorio con la marca', () => {
    const metadata = getMetadataArgsStorage();
    expect(metadata.tables.find((table) => table.target === Marca)?.name).toBe(
      'marcas',
    );
    expect(
      metadata.tables.find((table) => table.target === Categoria)?.name,
    ).toBe('categorias');

    const marca = metadata.relations.find(
      (relation) =>
        relation.target === Producto && relation.propertyName === 'marca',
    );
    expect(marca?.relationType).toBe('many-to-one');
    expect(marca?.options.nullable).toBe(false);
    expect(marca?.options.onDelete).toBe('RESTRICT');
    expect(
      metadata.joinColumns.find(
        (column) =>
          column.target === Producto && column.propertyName === 'marca',
      )?.name,
    ).toBe('marca_id');
  });

  it('vincula categorías mediante la tabla de unión de producto y categoría', () => {
    const metadata = getMetadataArgsStorage();
    const categorias = metadata.relations.find(
      (relation) =>
        relation.target === Producto && relation.propertyName === 'categorias',
    );
    expect(categorias?.relationType).toBe('many-to-many');

    const union = metadata.joinTables.find(
      (table) =>
        table.target === Producto && table.propertyName === 'categorias',
    );
    expect(union?.name).toBe('productos_categorias');
    expect(union?.joinColumns?.[0]?.name).toBe('producto_id');
    expect(union?.inverseJoinColumns?.[0]?.name).toBe('categoria_id');
  });
});
