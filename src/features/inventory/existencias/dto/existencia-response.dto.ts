import { ApiProperty } from '@nestjs/swagger';

export class UnidadExistenciaDto {
  @ApiProperty() id: string;
  @ApiProperty() nombre: string;
  @ApiProperty() simbolo: string;
}

export class UnidadSecundariaExistenciaDto extends UnidadExistenciaDto {
  @ApiProperty({ example: '12.00000000' }) factorABase: string;
}

export class MarcaExistenciaDto {
  @ApiProperty() id: string;
  @ApiProperty() nombre: string;
}

export class ProductoExistenciaDto {
  @ApiProperty() id: string;
  @ApiProperty() nombre: string;
  @ApiProperty({ type: MarcaExistenciaDto }) marca: MarcaExistenciaDto;
  @ApiProperty() activo: boolean;
  @ApiProperty({ type: UnidadExistenciaDto }) unidadBase: UnidadExistenciaDto;
}

export class ValorVarianteExistenciaDto {
  @ApiProperty() atributoId: string;
  @ApiProperty() atributo: string;
  @ApiProperty() valor: string;
}

export class VarianteExistenciaDto {
  @ApiProperty() id: string;
  @ApiProperty() sku: string;
  @ApiProperty() activo: boolean;
  @ApiProperty({ example: '39.90' }) precioVenta: string;
  @ApiProperty({ type: [ValorVarianteExistenciaDto] })
  valores: ValorVarianteExistenciaDto[];
}

export class AlmacenExistenciaDto {
  @ApiProperty() id: string;
  @ApiProperty() nombre: string;
}

export class ExistenciaConsultaDto {
  @ApiProperty({ type: ProductoExistenciaDto }) producto: ProductoExistenciaDto;
  @ApiProperty({ type: VarianteExistenciaDto }) variante: VarianteExistenciaDto;
  @ApiProperty({ type: AlmacenExistenciaDto }) almacen: AlmacenExistenciaDto;
  @ApiProperty({ example: '24.000000' }) cantidadBase: string;
  @ApiProperty({ nullable: true, example: '5.000000' }) minimoBase: string | null;
  @ApiProperty({ example: '120.000000' }) valorCosto: string;
  @ApiProperty({ nullable: true, example: '5.000000' }) costoPromedioBase:
    string | null;
  @ApiProperty() costoRegistradoCero: boolean;
  @ApiProperty({ type: [UnidadSecundariaExistenciaDto] })
  unidadesSecundarias: UnidadSecundariaExistenciaDto[];
}

export class ListaExistenciasResponseDto {
  @ApiProperty({ type: [ExistenciaConsultaDto] })
  items: ExistenciaConsultaDto[];
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalItems: number;
  @ApiProperty({ example: '120.000000' }) totalValorCosto: string;
}
