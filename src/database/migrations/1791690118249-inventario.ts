import { MigrationInterface, QueryRunner } from "typeorm";

export class Inventario1791690118249 implements MigrationInterface {
    name = 'Inventario1791690118249'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "unidades_producto" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "factor_a_base" numeric(20,8) NOT NULL, "producto_id" uuid NOT NULL, "unidad_id" uuid NOT NULL, CONSTRAINT "UQ_unidades_producto_producto_unidad" UNIQUE ("producto_id", "unidad_id"), CONSTRAINT "CHK_unidades_producto_factor_positivo" CHECK ("factor_a_base" > 0), CONSTRAINT "PK_c746da151e7cf98e84b914b69d4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."tipo_movimiento_inventario" AS ENUM('ingreso', 'salida', 'traslado', 'ajuste')`);
        await queryRunner.query(`CREATE TYPE "public"."estado_movimiento_inventario" AS ENUM('borrador', 'confirmado', 'anulado')`);
        await queryRunner.query(`CREATE TABLE "movimientos_inventario" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tipo" "public"."tipo_movimiento_inventario" NOT NULL, "fecha" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "estado" "public"."estado_movimiento_inventario" NOT NULL DEFAULT 'borrador', "motivo" text, "almacen_origen_id" uuid, "almacen_destino_id" uuid, "usuario_id" uuid NOT NULL, "proveedor_id" uuid, "compra_id" uuid, CONSTRAINT "CHK_movimientos_inventario_compra" CHECK ("compra_id" IS NULL OR "tipo" = 'ingreso'), CONSTRAINT "CHK_movimientos_inventario_proveedor" CHECK ("proveedor_id" IS NULL OR "tipo" = 'ingreso'), CONSTRAINT "CHK_movimientos_inventario_almacenes" CHECK (("tipo" = 'ingreso' AND "almacen_origen_id" IS NULL AND "almacen_destino_id" IS NOT NULL)
    OR ("tipo" = 'salida' AND "almacen_origen_id" IS NOT NULL AND "almacen_destino_id" IS NULL)
    OR ("tipo" = 'traslado' AND "almacen_origen_id" IS NOT NULL AND "almacen_destino_id" IS NOT NULL AND "almacen_origen_id" <> "almacen_destino_id")
    OR ("tipo" = 'ajuste' AND "almacen_origen_id" IS NULL AND "almacen_destino_id" IS NOT NULL)), CONSTRAINT "PK_812f6e4f95b017981363c4b9ff9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "proveedores" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nombre" character varying(200) NOT NULL, "documento" character varying(100), "contacto" character varying(200), CONSTRAINT "UQ_e247f38137bdec0322e9448d68b" UNIQUE ("documento"), CONSTRAINT "PK_1dcf121f19f362fb1b4c0a493a9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "comprobantes_compra" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nombre_original" character varying(255) NOT NULL, "tipo_mime" character varying(100) NOT NULL, "tamano_bytes" integer NOT NULL, "clave_almacenamiento" character varying(500) NOT NULL, "fecha_subida" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "compra_id" uuid NOT NULL, CONSTRAINT "UQ_c9a46de78562d93828c13f65955" UNIQUE ("clave_almacenamiento"), CONSTRAINT "CHK_comprobantes_compra_tamano_positivo" CHECK ("tamano_bytes" > 0), CONSTRAINT "PK_8cb1432ee13c4f0c136df18d47d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "compras" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fecha" date NOT NULL, "numero_documento" character varying(100), "total_documento" numeric(38,6), "observaciones" text, "fecha_registro" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "proveedor_id" uuid NOT NULL, "usuario_id" uuid NOT NULL, CONSTRAINT "CHK_compras_total_no_negativo" CHECK ("total_documento" IS NULL OR "total_documento" >= 0), CONSTRAINT "PK_63037d5249eefe140e3587ff6f2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "detalles_compra" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "cantidad" numeric(20,6) NOT NULL, "factor_a_base" numeric(20,8) NOT NULL, "precio_unitario" numeric(20,6) NOT NULL, "compra_id" uuid NOT NULL, "variante_id" uuid NOT NULL, "unidad_id" uuid NOT NULL, CONSTRAINT "CHK_detalles_compra_precio_no_negativo" CHECK ("precio_unitario" >= 0), CONSTRAINT "CHK_detalles_compra_factor_positivo" CHECK ("factor_a_base" > 0), CONSTRAINT "CHK_detalles_compra_cantidad_positiva" CHECK ("cantidad" > 0), CONSTRAINT "PK_06cde183eb1a5f47178b8731699" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "detalle_movimiento" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "cantidad" numeric(20,6) NOT NULL, "factor_a_base" numeric(20,8) NOT NULL, "cantidad_base" numeric(24,6) NOT NULL, "costo_total" numeric(38,6), "movimiento_id" uuid NOT NULL, "variante_id" uuid NOT NULL, "unidad_id" uuid NOT NULL, "detalle_compra_id" uuid, CONSTRAINT "CHK_detalle_movimiento_costo_total_no_negativo" CHECK ("costo_total" IS NULL OR "costo_total" >= 0), CONSTRAINT "CHK_detalle_movimiento_mismo_signo" CHECK ("cantidad" * "cantidad_base" > 0), CONSTRAINT "CHK_detalle_movimiento_cantidad_no_cero" CHECK ("cantidad" <> 0 AND "cantidad_base" <> 0), CONSTRAINT "CHK_detalle_movimiento_factor_positivo" CHECK ("factor_a_base" > 0), CONSTRAINT "PK_f37024c12613dc109b475cbfc36" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "unidades" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nombre" character varying(100) NOT NULL, "simbolo" character varying(20) NOT NULL, "tipo" character varying(30) NOT NULL, CONSTRAINT "UQ_18afad1bf99bd25e6034a36cdf4" UNIQUE ("nombre"), CONSTRAINT "PK_3e728a664b48bbd90a355065233" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "valores_variante" ("variante_id" uuid NOT NULL, "atributo_id" uuid NOT NULL, "valor" character varying(150) NOT NULL, CONSTRAINT "PK_68460d9ac1de5a0cf016163195a" PRIMARY KEY ("variante_id", "atributo_id"))`);
        await queryRunner.query(`CREATE TABLE "atributos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nombre" character varying(100) NOT NULL, CONSTRAINT "UQ_97b4c2195a81d38281a02c352b3" UNIQUE ("nombre"), CONSTRAINT "PK_82e0369bb2078634539823c67a7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "atributos_producto" ("producto_id" uuid NOT NULL, "atributo_id" uuid NOT NULL, CONSTRAINT "PK_b509c30babb0be717dc0e9ff700" PRIMARY KEY ("producto_id", "atributo_id"))`);
        await queryRunner.query(`CREATE TABLE "productos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nombre" character varying(200) NOT NULL, "descripcion" text, "activo" boolean NOT NULL DEFAULT true, "unidad_base_id" uuid NOT NULL, CONSTRAINT "PK_04f604609a0949a7f3b43400766" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "variantes_producto" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sku" character varying(100) NOT NULL, "codigo_barras" character varying(100), "precio" numeric(18,2) NOT NULL, "activo" boolean NOT NULL DEFAULT true, "producto_id" uuid NOT NULL, CONSTRAINT "UQ_86cae081c04f72309229a68b5d1" UNIQUE ("sku"), CONSTRAINT "UQ_a5b6bc53e03942cdf6b74dfd157" UNIQUE ("codigo_barras"), CONSTRAINT "PK_88c6aba4ba24923828e09cbac6d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "existencias" ("variante_id" uuid NOT NULL, "almacen_id" uuid NOT NULL, "cantidad" numeric(24,6) NOT NULL DEFAULT '0', "valor_costo" numeric(38,6) NOT NULL DEFAULT '0', CONSTRAINT "CHK_existencias_sin_valor_si_vacia" CHECK ("cantidad" <> 0 OR "valor_costo" = 0), CONSTRAINT "CHK_existencias_valor_costo_no_negativo" CHECK ("valor_costo" >= 0), CONSTRAINT "CHK_existencias_cantidad_no_negativa" CHECK ("cantidad" >= 0), CONSTRAINT "PK_72c514f1f5627bd53bcdf9482fd" PRIMARY KEY ("variante_id", "almacen_id"))`);
        await queryRunner.query(`CREATE TABLE "almacenes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nombre" character varying(150) NOT NULL, "activo" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_07fdf64dd35764f05ece2f8e23c" UNIQUE ("nombre"), CONSTRAINT "PK_2af9818dc2019bc97c7d26217e1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "unidades_producto" ADD CONSTRAINT "FK_8862935ab1549c31a2f1371a0d8" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "unidades_producto" ADD CONSTRAINT "FK_42783ad4bd0ac0cb14dab795021" FOREIGN KEY ("unidad_id") REFERENCES "unidades"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "FK_7fa224a32f1e0d3f9ff5cddd2a5" FOREIGN KEY ("almacen_origen_id") REFERENCES "almacenes"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "FK_d627830292c9fe877987698cda1" FOREIGN KEY ("almacen_destino_id") REFERENCES "almacenes"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "FK_c86769588f51c7bbb6bf78ca32b" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "FK_64194cec20fd510f65003c95db6" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "FK_2ded00d3f0d8e6f216a817f0355" FOREIGN KEY ("compra_id") REFERENCES "compras"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comprobantes_compra" ADD CONSTRAINT "FK_ae2742ce5e225369d77b355ed75" FOREIGN KEY ("compra_id") REFERENCES "compras"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "compras" ADD CONSTRAINT "FK_d7b3950fea313d15e46e0c59286" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "compras" ADD CONSTRAINT "FK_ec0332a11c8fa9c4330aaca0aea" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "detalles_compra" ADD CONSTRAINT "FK_adfe31e80383d22f04720a84843" FOREIGN KEY ("compra_id") REFERENCES "compras"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "detalles_compra" ADD CONSTRAINT "FK_27d563a3826de6c054e5792d31a" FOREIGN KEY ("variante_id") REFERENCES "variantes_producto"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "detalles_compra" ADD CONSTRAINT "FK_f48fee265d53acd02fbd5a29ce9" FOREIGN KEY ("unidad_id") REFERENCES "unidades"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "detalle_movimiento" ADD CONSTRAINT "FK_642cd895af27e2319b868318d81" FOREIGN KEY ("movimiento_id") REFERENCES "movimientos_inventario"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "detalle_movimiento" ADD CONSTRAINT "FK_0aa269be06b78e9bf949b256442" FOREIGN KEY ("variante_id") REFERENCES "variantes_producto"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "detalle_movimiento" ADD CONSTRAINT "FK_f8a7feb0394d8b8a87de6e41052" FOREIGN KEY ("unidad_id") REFERENCES "unidades"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "detalle_movimiento" ADD CONSTRAINT "FK_ca5d2ad3ca5a34c4029a2a2a233" FOREIGN KEY ("detalle_compra_id") REFERENCES "detalles_compra"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "valores_variante" ADD CONSTRAINT "FK_b0cc13acad0ebe162e4c7ed3ae7" FOREIGN KEY ("variante_id") REFERENCES "variantes_producto"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "valores_variante" ADD CONSTRAINT "FK_c6ea44b9c08b7453cf3468dba01" FOREIGN KEY ("atributo_id") REFERENCES "atributos"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "atributos_producto" ADD CONSTRAINT "FK_3dcc7118e17c6a253ea332b0265" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "atributos_producto" ADD CONSTRAINT "FK_cbc835c5cc3dd77d160de92d8ba" FOREIGN KEY ("atributo_id") REFERENCES "atributos"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "productos" ADD CONSTRAINT "FK_4e2b90119d92518628f053c1026" FOREIGN KEY ("unidad_base_id") REFERENCES "unidades"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "variantes_producto" ADD CONSTRAINT "FK_a16669d102a3cb11ccc79514a97" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "existencias" ADD CONSTRAINT "FK_152831f8130c9d91689d7504389" FOREIGN KEY ("variante_id") REFERENCES "variantes_producto"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "existencias" ADD CONSTRAINT "FK_32b1d225d53049557d9c2c686f6" FOREIGN KEY ("almacen_id") REFERENCES "almacenes"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "existencias" DROP CONSTRAINT "FK_32b1d225d53049557d9c2c686f6"`);
        await queryRunner.query(`ALTER TABLE "existencias" DROP CONSTRAINT "FK_152831f8130c9d91689d7504389"`);
        await queryRunner.query(`ALTER TABLE "variantes_producto" DROP CONSTRAINT "FK_a16669d102a3cb11ccc79514a97"`);
        await queryRunner.query(`ALTER TABLE "productos" DROP CONSTRAINT "FK_4e2b90119d92518628f053c1026"`);
        await queryRunner.query(`ALTER TABLE "atributos_producto" DROP CONSTRAINT "FK_cbc835c5cc3dd77d160de92d8ba"`);
        await queryRunner.query(`ALTER TABLE "atributos_producto" DROP CONSTRAINT "FK_3dcc7118e17c6a253ea332b0265"`);
        await queryRunner.query(`ALTER TABLE "valores_variante" DROP CONSTRAINT "FK_c6ea44b9c08b7453cf3468dba01"`);
        await queryRunner.query(`ALTER TABLE "valores_variante" DROP CONSTRAINT "FK_b0cc13acad0ebe162e4c7ed3ae7"`);
        await queryRunner.query(`ALTER TABLE "detalle_movimiento" DROP CONSTRAINT "FK_ca5d2ad3ca5a34c4029a2a2a233"`);
        await queryRunner.query(`ALTER TABLE "detalle_movimiento" DROP CONSTRAINT "FK_f8a7feb0394d8b8a87de6e41052"`);
        await queryRunner.query(`ALTER TABLE "detalle_movimiento" DROP CONSTRAINT "FK_0aa269be06b78e9bf949b256442"`);
        await queryRunner.query(`ALTER TABLE "detalle_movimiento" DROP CONSTRAINT "FK_642cd895af27e2319b868318d81"`);
        await queryRunner.query(`ALTER TABLE "detalles_compra" DROP CONSTRAINT "FK_f48fee265d53acd02fbd5a29ce9"`);
        await queryRunner.query(`ALTER TABLE "detalles_compra" DROP CONSTRAINT "FK_27d563a3826de6c054e5792d31a"`);
        await queryRunner.query(`ALTER TABLE "detalles_compra" DROP CONSTRAINT "FK_adfe31e80383d22f04720a84843"`);
        await queryRunner.query(`ALTER TABLE "compras" DROP CONSTRAINT "FK_ec0332a11c8fa9c4330aaca0aea"`);
        await queryRunner.query(`ALTER TABLE "compras" DROP CONSTRAINT "FK_d7b3950fea313d15e46e0c59286"`);
        await queryRunner.query(`ALTER TABLE "comprobantes_compra" DROP CONSTRAINT "FK_ae2742ce5e225369d77b355ed75"`);
        await queryRunner.query(`ALTER TABLE "movimientos_inventario" DROP CONSTRAINT "FK_2ded00d3f0d8e6f216a817f0355"`);
        await queryRunner.query(`ALTER TABLE "movimientos_inventario" DROP CONSTRAINT "FK_64194cec20fd510f65003c95db6"`);
        await queryRunner.query(`ALTER TABLE "movimientos_inventario" DROP CONSTRAINT "FK_c86769588f51c7bbb6bf78ca32b"`);
        await queryRunner.query(`ALTER TABLE "movimientos_inventario" DROP CONSTRAINT "FK_d627830292c9fe877987698cda1"`);
        await queryRunner.query(`ALTER TABLE "movimientos_inventario" DROP CONSTRAINT "FK_7fa224a32f1e0d3f9ff5cddd2a5"`);
        await queryRunner.query(`ALTER TABLE "unidades_producto" DROP CONSTRAINT "FK_42783ad4bd0ac0cb14dab795021"`);
        await queryRunner.query(`ALTER TABLE "unidades_producto" DROP CONSTRAINT "FK_8862935ab1549c31a2f1371a0d8"`);
        await queryRunner.query(`DROP TABLE "almacenes"`);
        await queryRunner.query(`DROP TABLE "existencias"`);
        await queryRunner.query(`DROP TABLE "variantes_producto"`);
        await queryRunner.query(`DROP TABLE "productos"`);
        await queryRunner.query(`DROP TABLE "atributos_producto"`);
        await queryRunner.query(`DROP TABLE "atributos"`);
        await queryRunner.query(`DROP TABLE "valores_variante"`);
        await queryRunner.query(`DROP TABLE "unidades"`);
        await queryRunner.query(`DROP TABLE "detalle_movimiento"`);
        await queryRunner.query(`DROP TABLE "detalles_compra"`);
        await queryRunner.query(`DROP TABLE "compras"`);
        await queryRunner.query(`DROP TABLE "comprobantes_compra"`);
        await queryRunner.query(`DROP TABLE "proveedores"`);
        await queryRunner.query(`DROP TABLE "movimientos_inventario"`);
        await queryRunner.query(`DROP TYPE "public"."estado_movimiento_inventario"`);
        await queryRunner.query(`DROP TYPE "public"."tipo_movimiento_inventario"`);
        await queryRunner.query(`DROP TABLE "unidades_producto"`);
    }

}
