import { describe, expect, it } from 'vitest';
import { UpdateVarianteSchema } from './update-variante.dto.js';

describe('UpdateVarianteSchema', () => {
  it('acepta campos parciales, código nulo y estado inactivo', () => {
    expect(UpdateVarianteSchema.parse({ precio: '0.00' })).toEqual({
      precio: '0.00',
    });
    expect(
      UpdateVarianteSchema.parse({ codigoBarras: null, activo: false }),
    ).toEqual({ codigoBarras: null, activo: false });
    expect(UpdateVarianteSchema.parse({ codigoBarras: ' 1234 ' })).toEqual({
      codigoBarras: '1234',
    });
  });

  it('rechaza cargas vacías, precios inválidos y edición de SKU/atributos/fotos', () => {
    for (const invalid of [
      {},
      { precio: '-1' },
      { precio: '1.999' },
      { precio: 20 },
      { codigoBarras: '' },
      { activo: 'false' },
      { sku: 'otro' },
      { valores: [] },
      { imagenesConservarIds: [] },
    ]) {
      expect(UpdateVarianteSchema.safeParse(invalid).success).toBe(false);
    }
  });
});
