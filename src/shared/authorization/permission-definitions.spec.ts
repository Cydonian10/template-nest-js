import { PERMISSION_CODES } from './permission-codes.js';
import {
  ACTIONS_BY_RESOURCE,
  PERMISSION_DEFINITIONS,
} from './permission-definitions.js';

describe('PERMISSION_DEFINITIONS', () => {
  it('mantiene códigos consistentes y definiciones únicas', () => {
    const codes = PERMISSION_DEFINITIONS.map(({ code }) => code);
    const pairs = PERMISSION_DEFINITIONS.map((definition) => {
      expect(definition.code).toBe(
        `${definition.resourceCode}_${definition.actionCode}`,
      );
      return `${definition.resourceCode}/${definition.actionCode}`;
    });

    expect(new Set(codes).size).toBe(codes.length);
    expect(new Set(pairs).size).toBe(pairs.length);
  });

  it('define todos los códigos y todas las acciones del catálogo', () => {
    const definedCodes = PERMISSION_DEFINITIONS.map(({ code }) => code).sort();
    const publicCodes = Object.values(PERMISSION_CODES).sort();
    const catalogCodes = Object.entries(ACTIONS_BY_RESOURCE)
      .flatMap(([resource, actions]) =>
        actions.map((action) => `${resource}_${action}`),
      )
      .sort();

    expect(definedCodes).toEqual(publicCodes);
    expect(definedCodes).toEqual(catalogCodes);
  });
});
