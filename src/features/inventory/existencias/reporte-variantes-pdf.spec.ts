import type { ContentTable, ContentText } from 'pdfmake/interfaces.js';
import type { ExistenciaConsultaDto } from './dto/existencia-response.dto.js';
import { FilterExistenciasSchema } from './dto/filter-existencias.dto.js';
import { definicionReporteVariantes } from './reporte-variantes-pdf.js';

function crearExistencia(sku: string, cantidadBase: string): ExistenciaConsultaDto {
  return {
    producto: {
      id: 'producto-1',
      nombre: 'Perno',
      marca: { id: 'marca-1', nombre: 'Marca' },
      activo: true,
      unidadBase: { id: 'unidad-1', nombre: 'Unidad', simbolo: 'u' },
    },
    variante: {
      id: sku,
      sku,
      activo: true,
      precioVenta: '3.00',
      valores: [],
    },
    almacen: { id: 'almacen-1', nombre: 'Principal' },
    cantidadBase,
    minimoBase: null,
    valorCosto: '0',
    costoPromedioBase: null,
    costoRegistradoCero: false,
    unidadesSecundarias: [],
  };
}

describe('definicionReporteVariantes', () => {
  it('muestra primero con stock, conserva el orden de cada grupo y no modifica los items originales', () => {
    const items = [
      crearExistencia('SIN-1', '0.000000'),
      crearExistencia('CON-1', '2.000000'),
      crearExistencia('SIN-2', '-1.000000'),
      crearExistencia('CON-2', '10.000000'),
      crearExistencia('CON-3', '0.500000'),
    ];
    const ordenOriginal = [...items];

    const documento = definicionReporteVariantes(
      items,
      FilterExistenciasSchema.parse({ almacenId: 'todos' }),
    );
    const tabla = (documento.content as unknown[])[3] as ContentTable;
    const skus = tabla.table.body
      .slice(1)
      .map((fila) => (fila[1] as ContentText).text);

    expect(skus).toEqual(['CON-1', 'CON-2', 'CON-3', 'SIN-1', 'SIN-2']);
    expect(items).toEqual(ordenOriginal);
  });
});
