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
    expect(
      UpdateVarianteSchema.parse({ activo: 'false', codigoBarras: '' }),
    ).toEqual({ activo: false, codigoBarras: null });
    expect(UpdateVarianteSchema.parse({ activo: 'true' })).toEqual({
      activo: true,
    });
  });

  it('acepta IDs de fotos propias como arreglo JSON de multipart o JSON nativo', () => {
    const id = '3ef90b51-24bf-45da-8a2a-4be5a424e40e';
    expect(
      UpdateVarianteSchema.parse({ imagenesConservarIds: `["${id}"]` }),
    ).toEqual({
      imagenesConservarIds: [id],
    });
    expect(UpdateVarianteSchema.parse({ imagenesConservarIds: [] })).toEqual({
      imagenesConservarIds: [],
    });
    expect(UpdateVarianteSchema.parse({})).toEqual({});
  });

  it('rechaza precios inválidos, IDs incorrectos y edición de SKU/atributos', () => {
    for (const invalid of [
      { precio: '-1' },
      { precio: '1.999' },
      { precio: 20 },
      { activo: 'yes' },
      { sku: 'otro' },
      { valores: [] },
      { imagenes: ['archivo'] },
      { imagenesConservarIds: ['no-uuid'] },
      { imagenesConservarIds: '[mal JSON' },
      {
        imagenesConservarIds: Array(11).fill(
          '3ef90b51-24bf-45da-8a2a-4be5a424e40e',
        ),
      },
    ]) {
      expect(UpdateVarianteSchema.safeParse(invalid).success).toBe(false);
    }
  });
});
