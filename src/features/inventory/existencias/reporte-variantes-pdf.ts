import type { TDocumentDefinitions } from 'pdfmake/interfaces.js';
import type { ExistenciaConsultaDto } from './dto/existencia-response.dto.js';
import type { FilterExistenciasDto } from './dto/filter-existencias.dto.js';

const formatoCantidad = new Intl.NumberFormat('es-PE', {
  maximumFractionDigits: 2,
});

const formatoPrecio = new Intl.NumberFormat('es-PE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function definicionReporteVariantes(
  items: ExistenciaConsultaDto[],
  filter: FilterExistenciasDto,
): TDocumentDefinitions {
  const itemsOrdenados = [...items].sort((a, b) => {
    const aConStock = Number(a.cantidadBase) > 0;
    const bConStock = Number(b.cantidadBase) > 0;
    return Number(bConStock) - Number(aConStock);
  });
  const encabezados = [
    'Producto / variante',
    'SKU',
    'Almacén',
    'Última compra / unidad base',
    'Precio de venta',
    'Stock',
    'Disponibilidad',
  ];
  const fecha = new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Lima',
  }).format(new Date());
  return {
    pageSize: 'A4',
    pageOrientation: 'landscape',
    pageMargins: [32, 38, 32, 42],
    defaultStyle: { font: 'Helvetica', fontSize: 8, color: '#24383d' },
    footer: (pagina, total) => ({
      text: `Reporte de variantes  ·  ${pagina} / ${total}`,
      alignment: 'right',
      color: '#62767a',
      fontSize: 8,
      margin: [32, 12, 32, 0],
    }),
    content: [
      {
        text: 'Reporte de variantes',
        fontSize: 20,
        bold: true,
        color: '#24383d',
        margin: [0, 0, 0, 5],
      },
      {
        text: 'Precios y existencias por almacén',
        color: '#52696d',
        fontSize: 10,
        margin: [0, 0, 0, 12],
      },
      {
        text: `Generado: ${fecha}   ·   Disponibilidad: ${filter.disponibilidad}   ·   Filas: ${items.length}`,
        color: '#52696d',
        margin: [0, 0, 0, 14],
      },
      {
        table: {
          headerRows: 1,
          widths: [180, '*', 100, 90, 75, 55, 75],
          body: [
            encabezados.map((text) => ({
              text,
              bold: true,
              color: '#ffffff',
              fillColor: '#34565a',
              margin: [2, 5, 2, 5],
            })),
            ...itemsOrdenados.map((item, indice) =>
              [
                {
                  text: [
                    item.producto.nombre,
                    ...item.variante.valores.map(
                      (valor) => `${valor.atributo}: ${valor.valor}`,
                    ),
                  ].join('\n'),
                  bold: true,
                },
                { text: item.variante.sku },
                { text: item.almacen.nombre },
                {
                  text:
                    item.variante.precioUltimaCompraBase != null
                      ? `S/ ${formatoPrecio.format(Number(item.variante.precioUltimaCompraBase))}`
                      : '—',
                  alignment: 'right' as const,
                },
                {
                  text: `S/ ${formatoPrecio.format(Number(item.variante.precioVenta))}`,
                  alignment: 'right' as const,
                },
                {
                  text: `${formatoCantidad.format(Number(item.cantidadBase))} ${item.producto.unidadBase.simbolo}`,
                  alignment: 'right' as const,
                },
                {
                  text:
                    Number(item.cantidadBase) > 0 ? 'Con stock' : 'Sin stock',
                },
              ].map((cell) => ({
                ...cell,
                fillColor: indice % 2 === 0 ? '#f1f6f5' : '#ffffff',
                margin: [2, 5, 2, 5] as [number, number, number, number],
              })),
            ),
          ],
        },
        layout: { hLineWidth: () => 0, vLineWidth: () => 0 },
      },
      ...(items.length
        ? []
        : [
            {
              text: 'No hay variantes para los filtros seleccionados.',
              margin: [0, 12, 0, 0] as [number, number, number, number],
            },
          ]),
    ],
  };
}
