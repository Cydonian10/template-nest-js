import { createSystemSchema } from './create-system.dto.js';
import { SystemResponseDto } from './system-response.dto.js';
import type { System } from '../../entities/system.entity.js';

describe('System DTOs', () => {
  const system = {
    id: 'system-id',
    code: 'VENTAS',
    name: 'Ventas',
    description: 'Sistema de ventas',
    active: true,
    order: 1,
  };

  it('no exige ni expone rutas de navegación', () => {
    const input = {
      code: system.code,
      name: system.name,
      description: system.description,
    };
    expect(createSystemSchema.safeParse(input).success).toBe(true);
    expect(
      createSystemSchema.safeParse({ ...input, path: '/ventas' }).success,
    ).toBe(false);
    expect(SystemResponseDto.from(system as System)).toEqual(system);
  });
});
