import { z } from 'zod';
import { PaginationSchema } from '../../../../shared/pagination/pagination.dto.js';

export const ListarCatalogoSchema = PaginationSchema.extend({
  almacenId: z.uuid(),
  q: z.string().trim().max(200).default(''),
});

export type ListarCatalogoDto = z.infer<typeof ListarCatalogoSchema>;

export interface VarianteCatalogo {
  id: string;
  productoId: string;
  nombre: string;
  marca: string;
  sku: string;
  precio: string;
  stock: string;
  atributos: { nombre: string; valor: string }[];
  unidadBase: { id: string; nombre: string; simbolo: string };
  unidades: {
    id: string;
    nombre: string;
    simbolo: string;
    factorABase: string;
  }[];
}

export interface CatalogoPagina {
  items: VarianteCatalogo[];
  page: number;
  limit: number;
  totalItems: number;
}
