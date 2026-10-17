import { describe, expect, it } from 'vitest';
import { CreateCompraSchema } from './create-compra.dto.js';

const compra = {
  proveedorId: '87f481f1-88c9-4a8c-bcf1-f23edcc52c42',
  almacenId: '7d2624bb-cc5d-4291-a732-595d39070687',
  tipoDocumento: 'factura',
  fecha: '2026-10-17',
  serieDocumento: 'F001',
  numeroDocumento: '00001234',
  renglones: [
    {
      varianteId: '3ef90b51-24bf-45da-8a2a-4be5a424e40e',
      unidadId: '3c4b26b7-d0f3-484a-945f-33b66baf855c',
      cantidad: '2.000000',
      precioUnitario: '1.250000',
    },
  ],
};

describe('CreateCompraSchema', () => {
  it('conserva decimales como texto y normaliza el documento', () => {
    expect(
      CreateCompraSchema.parse({ ...compra, serieDocumento: ' F001 ' }),
    ).toMatchObject({
      serieDocumento: 'F001',
      renglones: [{ cantidad: '2.000000', precioUnitario: '1.250000' }],
    });
  });

  it('no acepta usuario, factor, total o campos incompletos desde el cliente', () => {
    expect(
      CreateCompraSchema.safeParse({ ...compra, usuarioId: compra.proveedorId })
        .success,
    ).toBe(false);
    expect(
      CreateCompraSchema.safeParse({ ...compra, totalDocumento: '20' }).success,
    ).toBe(false);
    expect(
      CreateCompraSchema.safeParse({ ...compra, renglones: [] }).success,
    ).toBe(false);
    expect(
      CreateCompraSchema.safeParse({
        ...compra,
        renglones: [{ ...compra.renglones[0], factorABase: '10' }],
      }).success,
    ).toBe(false);
    expect(
      CreateCompraSchema.safeParse({
        ...compra,
        renglones: [{ ...compra.renglones[0], cantidad: '0.000000' }],
      }).success,
    ).toBe(false);
    expect(
      CreateCompraSchema.safeParse({
        ...compra,
        renglones: [{ ...compra.renglones[0], precioUnitario: '-1' }],
      }).success,
    ).toBe(false);
  });
});
