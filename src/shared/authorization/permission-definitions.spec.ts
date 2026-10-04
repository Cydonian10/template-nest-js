import { PERMISSION_CODES } from './permission-codes.js';
import { PERMISSION_DEFINITIONS } from './permission-definitions.js';
import { SYSTEM_CODES } from './system-codes.js';

describe('PERMISSION_DEFINITIONS', () => {
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
  });
});
