import PdfPrinter from 'pdfmake';
import type { TDocumentDefinitions } from 'pdfmake/interfaces.js';

// Las fuentes estándar están integradas en PDF y no dependen de rutas de despliegue.
const printer = new PdfPrinter({
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
});

export function generarPdf(definicion: TDocumentDefinitions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const documento = printer.createPdfKitDocument(definicion);
      const partes: Buffer[] = [];
      documento.on('data', (parte: Buffer) => partes.push(parte));
      documento.on('error', reject);
      documento.on('end', () => resolve(Buffer.concat(partes)));
      documento.end();
    } catch (error) {
      reject(error);
    }
  });
}
