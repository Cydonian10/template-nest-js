import { PERMISSION_DEFINITIONS } from './permission-definitions.js';

describe('PERMISSION_DEFINITIONS', () => {
  it('mantiene códigos consistentes y parejas recurso/acción únicas', () => {
    const pairs = PERMISSION_DEFINITIONS.map((definition) => {
      expect(definition.code).toBe(
        `${definition.resourceCode}_${definition.actionCode}`,
      );
      return `${definition.resourceCode}/${definition.actionCode}`;
    });

    expect(new Set(pairs).size).toBe(pairs.length);
  });
});
