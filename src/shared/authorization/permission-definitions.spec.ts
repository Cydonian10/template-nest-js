import { PERMISSION_CODES } from './permission-codes.js';
import { PERMISSION_DEFINITIONS } from './permission-definitions.js';
import { SYSTEM_CODES } from './system-codes.js';
import { SYSTEM_DEFINITIONS } from './system-definitions.js';

describe('PERMISSION_DEFINITIONS', () => {
  it('registra Ventas con su permiso de lectura sin asignarlo a roles', () => {
    expect(SYSTEM_DEFINITIONS[SYSTEM_CODES.VENTAS]).toEqual({
      name: 'Ventas',
      description: 'Gestiona ventas, cajas y turnos.',
    });
    expect(PERMISSION_DEFINITIONS).toContainEqual({
      systemCode: SYSTEM_CODES.VENTAS,
      code: PERMISSION_CODES.CAJAS_TURNOS_READ,
      name: 'Leer cajas y turnos',
      resourceCode: 'CAJAS_TURNOS',
      actionCode: 'LEER',
    });
    expect(PERMISSION_DEFINITIONS).not.toContainEqual(
      expect.objectContaining({ roleCode: expect.anything() }),
    );
  });

  it('mantiene códigos consistentes y definiciones únicas', () => {
    const codes = PERMISSION_DEFINITIONS.map(({ code }) => code);
    const pairs = PERMISSION_DEFINITIONS.map((definition) => {
      expect(Object.values(SYSTEM_CODES)).toContain(definition.systemCode);
      expect(definition.code).toBe(
        `${definition.resourceCode}_${definition.actionCode}`,
      );
      return `${definition.systemCode}/${definition.resourceCode}/${definition.actionCode}`;
    });

    expect(
      new Set(
        PERMISSION_DEFINITIONS.map(
          ({ systemCode, code }) => `${systemCode}/${code}`,
        ),
      ).size,
    ).toBe(codes.length);
    expect(new Set(pairs).size).toBe(pairs.length);
  });

  it('define todos los códigos públicos y asocia cada permiso a un sistema', () => {
    const definedCodes = [
      ...new Set(PERMISSION_DEFINITIONS.map(({ code }) => code)),
    ].sort();
    const publicCodes = Object.values(PERMISSION_CODES).sort();

    expect(definedCodes).toEqual(publicCodes);
    expect(
      PERMISSION_DEFINITIONS.some(
        ({ systemCode }) => systemCode === SYSTEM_CODES.ACCESS_CONTROL,
      ),
    ).toBe(true);
    expect(PERMISSION_DEFINITIONS).toContainEqual({
      systemCode: SYSTEM_CODES.INVENTARIO,
      code: PERMISSION_CODES.UNIDADES_CREATE,
      name: 'Crear unidades',
      resourceCode: 'UNIDADES',
      actionCode: 'CREAR',
    });
  });

  it('registra EXISTENCIAS_LEER en INVENTARIO sin asignarlo a roles', () => {
    expect(PERMISSION_DEFINITIONS).toContainEqual({
      systemCode: SYSTEM_CODES.INVENTARIO,
      code: PERMISSION_CODES.EXISTENCIAS_READ,
      name: 'Leer existencias',
      resourceCode: 'EXISTENCIAS',
      actionCode: 'LEER',
    });
    expect(PERMISSION_DEFINITIONS).not.toContainEqual(
      expect.objectContaining({ roleCode: expect.anything() }),
    );
  });

  it('registra EXISTENCIAS_EDITAR_MINIMO como permiso independiente y sin rol', () => {
    expect(PERMISSION_DEFINITIONS).toContainEqual({
      systemCode: SYSTEM_CODES.INVENTARIO,
      code: PERMISSION_CODES.EXISTENCIAS_EDIT_MINIMO,
      name: 'Editar mínimo de existencias',
      resourceCode: 'EXISTENCIAS',
      actionCode: 'EDITAR_MINIMO',
    });
    expect(PERMISSION_CODES.EXISTENCIAS_EDIT_MINIMO).not.toBe(
      PERMISSION_CODES.EXISTENCIAS_READ,
    );
    expect(PERMISSION_DEFINITIONS).not.toContainEqual(
      expect.objectContaining({ roleCode: expect.anything() }),
    );
  });

  it('registra PROVEEDORES_CREAR independientemente de lectura sin asignarlo a roles', () => {
    expect(PERMISSION_DEFINITIONS).toContainEqual({
      systemCode: SYSTEM_CODES.INVENTARIO,
      code: PERMISSION_CODES.PROVEEDORES_CREATE,
      name: 'Crear proveedores',
      resourceCode: 'PROVEEDORES',
      actionCode: 'CREAR',
    });
    expect(PERMISSION_CODES.PROVEEDORES_CREATE).not.toBe(
      PERMISSION_CODES.PROVEEDORES_READ,
    );
    expect(PERMISSION_DEFINITIONS).not.toContainEqual(
      expect.objectContaining({ roleCode: expect.anything() }),
    );
  });

  it('reutiliza los dos permisos de productos para marcas y categorías sin crear permisos nuevos', () => {
    expect(
      PERMISSION_DEFINITIONS.filter(
        ({ systemCode, resourceCode }) =>
          systemCode === SYSTEM_CODES.INVENTARIO &&
          resourceCode === 'PRODUCTOS',
      ).map(({ code }) => code),
    ).toEqual([
      PERMISSION_CODES.PRODUCTS_READ,
      PERMISSION_CODES.PRODUCTS_UPDATE,
    ]);
    expect(
      PERMISSION_DEFINITIONS.some(({ resourceCode }) =>
        ['MARCAS', 'CATEGORIAS'].includes(resourceCode),
      ),
    ).toBe(false);
  });

  it('registra permisos de movimientos por lectura y tipo sin asignarlos a roles', () => {
    expect(PERMISSION_DEFINITIONS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          systemCode: SYSTEM_CODES.INVENTARIO,
          code: PERMISSION_CODES.MOVIMIENTOS_READ,
          resourceCode: 'MOVIMIENTOS',
          actionCode: 'LEER',
        }),
        expect.objectContaining({
          systemCode: SYSTEM_CODES.INVENTARIO,
          code: PERMISSION_CODES.SALIDAS_CREATE,
          resourceCode: 'SALIDAS',
          actionCode: 'CREAR',
        }),
        expect.objectContaining({
          systemCode: SYSTEM_CODES.INVENTARIO,
          code: PERMISSION_CODES.TRASLADOS_CREATE,
          resourceCode: 'TRASLADOS',
          actionCode: 'CREAR',
        }),
        expect.objectContaining({
          systemCode: SYSTEM_CODES.INVENTARIO,
          code: PERMISSION_CODES.AJUSTES_CREATE,
          resourceCode: 'AJUSTES',
          actionCode: 'CREAR',
        }),
      ]),
    );
    expect(PERMISSION_DEFINITIONS).not.toContainEqual(
      expect.objectContaining({ roleCode: expect.anything() }),
    );
  });
});
