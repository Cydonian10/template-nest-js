import { describe, expect, it } from 'vitest';
import { CreateAlmacenSchema, FilterAlmacenSchema, UpdateAlmacenSchema } from './almacenes.dto.js';

describe('Validación de almacenes', () => {
  it('interpreta false como filtro de inactivos, no como ausencia de filtro', () => {
    expect(FilterAlmacenSchema.parse({ page: '2', limit: '10', activo: 'false' })).toEqual({
      page: 2, limit: 10, activo: false,
    });
    expect(FilterAlmacenSchema.safeParse({ activo: 'cualquiera' }).success).toBe(false);
  });

  it('admite el estado por defecto, rechaza nombres vacíos y cambios vacíos', () => {
    expect(CreateAlmacenSchema.parse({ nombre: 'Principal' })).toEqual({ nombre: 'Principal', activo: true });
    expect(CreateAlmacenSchema.safeParse({ nombre: '  ' }).success).toBe(false);
    expect(UpdateAlmacenSchema.safeParse({}).success).toBe(false);
    expect(UpdateAlmacenSchema.parse({ activo: false })).toEqual({ activo: false });
  });
});
