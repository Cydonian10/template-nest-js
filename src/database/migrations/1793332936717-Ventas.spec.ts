import type { QueryRunner } from 'typeorm';
import { Ventas1793332936717 } from './1793332936717-Ventas.js';

describe('Ventas1793332936717', () => {
  it('crea todas las tablas de ventas sin modificar tablas existentes', async () => {
    const query = vi.fn().mockResolvedValue(undefined);
    await new Ventas1793332936717().up({ query } as unknown as QueryRunner);
    const sql = query.mock.calls
      .map(([statement]) => statement as string)
      .join('\n');

    for (const table of [
      'cajas',
      'turnos_caja',
      'movimientos_caja',
      'ventas',
      'detalles_venta',
      'pagos_venta',
      'vueltos_venta',
      'tickets_venta',
      'descuentos_venta',
      'promociones',
      'configuracion_descuentos',
      'devoluciones_venta',
      'detalles_devolucion_venta',
      'reintegros_venta',
    ]) {
      expect(sql).toContain(`CREATE TABLE "${table}"`);
    }
    expect(sql.match(/CREATE TYPE "public"\."medio_pago_venta"/g)).toHaveLength(
      1,
    );
    expect(sql).toContain('"base_imponible" numeric(18,2)');
    expect(sql).toContain('CREATE UNIQUE INDEX "UQ_turnos_caja_abiertos"');
    expect(sql).not.toMatch(
      /ALTER TABLE "(?:productos_categorias|almacenes|correcciones_compra|minimos_existencia)"/,
    );
  });

  it('elimina el enum compartido después de sus tablas', async () => {
    const query = vi.fn().mockResolvedValue(undefined);
    await new Ventas1793332936717().down({ query } as unknown as QueryRunner);
    const statements = query.mock.calls.map(
      ([statement]) => statement as string,
    );
    const enumIndex = statements.indexOf(
      'DROP TYPE "public"."medio_pago_venta"',
    );
    expect(enumIndex).toBeGreaterThan(
      statements.indexOf('DROP TABLE "pagos_venta"'),
    );
    expect(enumIndex).toBeGreaterThan(
      statements.indexOf('DROP TABLE "vueltos_venta"'),
    );
    expect(enumIndex).toBeGreaterThan(
      statements.indexOf('DROP TABLE "reintegros_venta"'),
    );
  });
});
