import { CreateAtributoSchema } from './create-atributo.dto.js';
import { UpdateAtributoSchema } from './update-atributo.dto.js';
import { FilterAtributoSchema } from './filter-atributo.dto.js';
import { AtributoResponseDto } from './atributo-response.dto.js';
import type { Atributo } from '../../entities/atributo.entity.js';

describe('DTOs de atributos', () => {
  it('requiere un nombre válido al crear o actualizar', () => {
    expect(CreateAtributoSchema.parse({ nombre: ' Color ' })).toEqual({
      nombre: 'Color',
    });
    expect(UpdateAtributoSchema.parse({ nombre: ' Talla ' })).toEqual({
      nombre: 'Talla',
    });
    for (const schema of [CreateAtributoSchema, UpdateAtributoSchema]) {
      expect(() => schema.parse({})).toThrow();
      expect(() => schema.parse({ nombre: '  ' })).toThrow();
      expect(() => schema.parse({ nombre: 'a'.repeat(101) })).toThrow();
      expect(() => schema.parse({ nombre: 'Color', extra: true })).toThrow();
    }
  });

  it('pagina y filtra por nombre', () => {
    expect(FilterAtributoSchema.parse({})).toEqual({ page: 1, limit: 20 });
    expect(
      FilterAtributoSchema.parse({ page: '2', limit: '10', nombre: ' col ' }),
    ).toEqual({
      page: 2,
      limit: 10,
      nombre: 'col',
    });
    for (const filter of [
      { page: '0' },
      { limit: '101' },
      { nombre: '  ' },
      { otro: true },
    ]) {
      expect(() => FilterAtributoSchema.parse(filter)).toThrow();
    }
  });

  it('devuelve solo id y nombre', () => {
    expect(
      AtributoResponseDto.from({
        id: 'atributo-1',
        nombre: 'Color',
        productos: [],
      } as unknown as Atributo),
    ).toEqual({ id: 'atributo-1', nombre: 'Color' });
  });
});
