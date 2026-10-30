import { MigrationInterface, QueryRunner } from "typeorm";

export class Ventas1793332936717 implements MigrationInterface {
    name = 'Ventas1793332936717'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."tipo_descuento_promocion" AS ENUM('porcentaje', 'monto_fijo')`);
        await queryRunner.query(`CREATE TABLE "promociones" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "cantidad_minima" numeric(20,6) NOT NULL, "tipo_descuento" "public"."tipo_descuento_promocion" NOT NULL, "valor" numeric(18,2) NOT NULL, "vigente_desde" TIMESTAMP WITH TIME ZONE NOT NULL, "vigente_hasta" TIMESTAMP WITH TIME ZONE, "activo" boolean NOT NULL DEFAULT true, "producto_id" uuid NOT NULL, "unidad_id" uuid NOT NULL, CONSTRAINT "CHK_promociones_vigencia" CHECK ("vigente_hasta" IS NULL OR "vigente_hasta" >= "vigente_desde"), CONSTRAINT "CHK_promociones_valor" CHECK ("valor" > 0 AND ("tipo_descuento" <> 'porcentaje' OR "valor" <= 100)), CONSTRAINT "CHK_promociones_cantidad_minima" CHECK ("cantidad_minima" > 0), CONSTRAINT "PK_c82363f1aaeada3921a25a9eafa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."origen_descuento_venta" AS ENUM('promocion', 'manual')`);
        await queryRunner.query(`CREATE TABLE "descuentos_venta" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "origen" "public"."origen_descuento_venta" NOT NULL, "importe" numeric(18,2) NOT NULL, "venta_id" uuid NOT NULL, "detalle_venta_id" uuid, "promocion_id" uuid, "usuario_id" uuid, CONSTRAINT "CHK_descuentos_venta_origen" CHECK (("origen" = 'promocion' AND "promocion_id" IS NOT NULL AND "usuario_id" IS NULL) OR ("origen" = 'manual' AND "promocion_id" IS NULL AND "usuario_id" IS NOT NULL)), CONSTRAINT "CHK_descuentos_venta_importe" CHECK ("importe" > 0), CONSTRAINT "PK_ce97da4da824d98d8efc0615933" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."medio_pago_venta" AS ENUM('efectivo', 'yape')`);
        await queryRunner.query(`CREATE TABLE "pagos_venta" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "medio" "public"."medio_pago_venta" NOT NULL, "importe" numeric(18,2) NOT NULL, "fecha" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "venta_id" uuid NOT NULL, CONSTRAINT "CHK_pagos_venta_importe" CHECK ("importe" > 0), CONSTRAINT "PK_4c86df5e03d591485cb8fd20e96" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "reintegros_venta" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "medio" "public"."medio_pago_venta" NOT NULL, "importe" numeric(18,2) NOT NULL, "fecha" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "devolucion_id" uuid NOT NULL, CONSTRAINT "CHK_reintegros_venta_importe" CHECK ("importe" > 0), CONSTRAINT "PK_b0e9e74f8a560ceba5c9f01f45e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."tipo_devolucion_venta" AS ENUM('anulacion', 'devolucion')`);
        await queryRunner.query(`CREATE TABLE "devoluciones_venta" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tipo" "public"."tipo_devolucion_venta" NOT NULL, "motivo" text NOT NULL, "base_imponible" numeric(18,2) NOT NULL, "igv" numeric(18,2) NOT NULL, "importe" numeric(18,2) NOT NULL, "fecha" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "venta_id" uuid NOT NULL, "turno_id" uuid NOT NULL, "usuario_id" uuid NOT NULL, "movimiento_inventario_id" uuid, CONSTRAINT "REL_7326abeeaccceedccd31a5b42e" UNIQUE ("movimiento_inventario_id"), CONSTRAINT "CHK_devoluciones_venta_importes" CHECK ("importe" >= 0 AND "base_imponible" >= 0 AND "igv" >= 0), CONSTRAINT "PK_d51cc3aa053995cda9816ba1c39" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "detalles_devolucion_venta" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "cantidad" numeric(20,6) NOT NULL, "cantidad_base" numeric(24,6) NOT NULL, "importe" numeric(18,2) NOT NULL, "devolucion_id" uuid NOT NULL, "detalle_venta_id" uuid NOT NULL, CONSTRAINT "CHK_detalles_devolucion_importe" CHECK ("importe" >= 0), CONSTRAINT "CHK_detalles_devolucion_cantidad" CHECK ("cantidad" > 0 AND "cantidad_base" > 0), CONSTRAINT "PK_b7b784bef1327c7c92f213697b6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "detalles_venta" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "cantidad" numeric(20,6) NOT NULL, "factor_a_base" numeric(20,8) NOT NULL, "cantidad_base" numeric(24,6) NOT NULL, "precio_unitario" numeric(18,2) NOT NULL, "subtotal" numeric(18,2) NOT NULL, "descuento_promocional" numeric(18,2) NOT NULL, "descuento_manual" numeric(18,2) NOT NULL, "total" numeric(18,2) NOT NULL, "venta_id" uuid NOT NULL, "variante_id" uuid NOT NULL, "unidad_id" uuid NOT NULL, CONSTRAINT "CHK_detalles_venta_importes" CHECK ("precio_unitario" >= 0 AND "subtotal" >= 0 AND "descuento_promocional" >= 0 AND "descuento_manual" >= 0 AND "total" >= 0), CONSTRAINT "CHK_detalles_venta_cantidades" CHECK ("cantidad" > 0 AND "factor_a_base" > 0 AND "cantidad_base" > 0), CONSTRAINT "PK_38c8bb56cd1fd62836f770fff4f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "vueltos_venta" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "medio" "public"."medio_pago_venta" NOT NULL, "importe" numeric(18,2) NOT NULL, "fecha" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "venta_id" uuid NOT NULL, CONSTRAINT "CHK_vueltos_venta_importe" CHECK ("importe" > 0), CONSTRAINT "PK_83012b8720d477319b9dbdcbb14" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "tickets_venta" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fecha" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "venta_id" uuid NOT NULL, CONSTRAINT "REL_6de4bfbe7692994e40bc282c57" UNIQUE ("venta_id"), CONSTRAINT "PK_a61cf1dfa85350cb481b849b4e4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."estado_venta" AS ENUM('confirmada', 'parcialmente_devuelta', 'devuelta', 'anulada')`);
        await queryRunner.query(`CREATE TABLE "ventas" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fecha" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "estado" "public"."estado_venta" NOT NULL DEFAULT 'confirmada', "subtotal" numeric(18,2) NOT NULL, "descuento_promocional" numeric(18,2) NOT NULL, "descuento_manual" numeric(18,2) NOT NULL, "base_imponible" numeric(18,2) NOT NULL, "igv" numeric(18,2) NOT NULL, "total" numeric(18,2) NOT NULL, "turno_id" uuid NOT NULL, "almacen_id" uuid NOT NULL, "usuario_id" uuid NOT NULL, "movimiento_inventario_id" uuid, CONSTRAINT "REL_1cfc70b81ce44003e0fc57cbc4" UNIQUE ("movimiento_inventario_id"), CONSTRAINT "CHK_ventas_importes" CHECK ("subtotal" >= 0 AND "descuento_promocional" >= 0 AND "descuento_manual" >= 0 AND "base_imponible" >= 0 AND "igv" >= 0 AND "total" >= 0), CONSTRAINT "PK_b8b73abe8561829c019531d9a2e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."tipo_movimiento_caja" AS ENUM('ingreso', 'egreso')`);
        await queryRunner.query(`CREATE TABLE "movimientos_caja" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tipo" "public"."tipo_movimiento_caja" NOT NULL, "importe" numeric(18,2) NOT NULL, "motivo" text NOT NULL, "fecha" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "turno_id" uuid NOT NULL, "usuario_id" uuid NOT NULL, CONSTRAINT "CHK_movimientos_caja_importe" CHECK ("importe" > 0), CONSTRAINT "PK_a35825837a156d21e0b922fa627" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."tipo_cierre_caja" AS ENUM('turno', 'dia')`);
        await queryRunner.query(`CREATE TABLE "turnos_caja" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fecha_operativa" date NOT NULL, "fecha_apertura" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fecha_cierre" TIMESTAMP WITH TIME ZONE, "saldo_inicial" numeric(18,2) NOT NULL, "efectivo_esperado" numeric(18,2), "efectivo_contado" numeric(18,2), "diferencia" numeric(18,2), "tipo_cierre" "public"."tipo_cierre_caja", "caja_id" uuid NOT NULL, "usuario_apertura_id" uuid NOT NULL, "usuario_cierre_id" uuid, CONSTRAINT "CHK_turnos_caja_cierre" CHECK (("fecha_cierre" IS NULL AND "efectivo_esperado" IS NULL AND "efectivo_contado" IS NULL AND "diferencia" IS NULL AND "tipo_cierre" IS NULL AND "usuario_cierre_id" IS NULL) OR ("fecha_cierre" IS NOT NULL AND "efectivo_esperado" IS NOT NULL AND "efectivo_contado" IS NOT NULL AND "diferencia" IS NOT NULL AND "tipo_cierre" IS NOT NULL AND "usuario_cierre_id" IS NOT NULL)), CONSTRAINT "CHK_turnos_caja_saldo_inicial" CHECK ("saldo_inicial" >= 0), CONSTRAINT "PK_a03721ede79454a666476ef5bc2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_turnos_caja_abiertos" ON "turnos_caja"  ("caja_id") WHERE "fecha_cierre" IS NULL`);
        await queryRunner.query(`CREATE TABLE "cajas" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "codigo" character varying(50) NOT NULL, "nombre" character varying(150) NOT NULL, "activo" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_f6eee9b110288da2f9c28d3edfe" UNIQUE ("codigo"), CONSTRAINT "PK_92b27e5f4ab36a544f37bf45e09" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "configuracion_descuentos" ("id" smallint NOT NULL DEFAULT '1', "limite_manual" numeric(18,2) NOT NULL, "actualizado_en" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_configuracion_descuentos_limite" CHECK ("limite_manual" >= 0), CONSTRAINT "CHK_configuracion_descuentos_unica" CHECK ("id" = 1), CONSTRAINT "PK_d8f6ac098b5840b30a6941f706a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "promociones" ADD CONSTRAINT "FK_0318319830d1d6cd54d16780572" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "promociones" ADD CONSTRAINT "FK_223931a80391820c5b7ab740a56" FOREIGN KEY ("unidad_id") REFERENCES "unidades"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "descuentos_venta" ADD CONSTRAINT "FK_14ed97fd559efed0cf16f9fc543" FOREIGN KEY ("venta_id") REFERENCES "ventas"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "descuentos_venta" ADD CONSTRAINT "FK_cb07f19c04c7d95a93bd9d9e2f3" FOREIGN KEY ("detalle_venta_id") REFERENCES "detalles_venta"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "descuentos_venta" ADD CONSTRAINT "FK_796ff7c77b6dce926df4d42a441" FOREIGN KEY ("promocion_id") REFERENCES "promociones"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "descuentos_venta" ADD CONSTRAINT "FK_e5a29b9fbfdda29bcb1c0bd84fe" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pagos_venta" ADD CONSTRAINT "FK_463dd9a6f5a8957960c34e44572" FOREIGN KEY ("venta_id") REFERENCES "ventas"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reintegros_venta" ADD CONSTRAINT "FK_a12f6ab4891a3d7333e4f293ff9" FOREIGN KEY ("devolucion_id") REFERENCES "devoluciones_venta"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "devoluciones_venta" ADD CONSTRAINT "FK_561095838c0526ec086ae7c9158" FOREIGN KEY ("venta_id") REFERENCES "ventas"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "devoluciones_venta" ADD CONSTRAINT "FK_364bbdcc351a2ce5f2cce92021d" FOREIGN KEY ("turno_id") REFERENCES "turnos_caja"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "devoluciones_venta" ADD CONSTRAINT "FK_a7ab4264280bba73f6317bae926" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "devoluciones_venta" ADD CONSTRAINT "FK_7326abeeaccceedccd31a5b42e2" FOREIGN KEY ("movimiento_inventario_id") REFERENCES "movimientos_inventario"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "detalles_devolucion_venta" ADD CONSTRAINT "FK_10952f6ab09de3378f0776714a9" FOREIGN KEY ("devolucion_id") REFERENCES "devoluciones_venta"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "detalles_devolucion_venta" ADD CONSTRAINT "FK_68fc22cecff04df0456aab8f5a4" FOREIGN KEY ("detalle_venta_id") REFERENCES "detalles_venta"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "detalles_venta" ADD CONSTRAINT "FK_3ae9489835ca1a6c91b994e6324" FOREIGN KEY ("venta_id") REFERENCES "ventas"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "detalles_venta" ADD CONSTRAINT "FK_ab69c1a2f0343563b2905e1b926" FOREIGN KEY ("variante_id") REFERENCES "variantes_producto"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "detalles_venta" ADD CONSTRAINT "FK_fd8bdc6f765b94dd3f81bad1ea9" FOREIGN KEY ("unidad_id") REFERENCES "unidades"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vueltos_venta" ADD CONSTRAINT "FK_dd9de97d477f994c2febc575286" FOREIGN KEY ("venta_id") REFERENCES "ventas"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tickets_venta" ADD CONSTRAINT "FK_6de4bfbe7692994e40bc282c573" FOREIGN KEY ("venta_id") REFERENCES "ventas"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ventas" ADD CONSTRAINT "FK_adc61de840b86c266fe58ee1b44" FOREIGN KEY ("turno_id") REFERENCES "turnos_caja"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ventas" ADD CONSTRAINT "FK_e72deb228c4cc8ba8d5ed9654d5" FOREIGN KEY ("almacen_id") REFERENCES "almacenes"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ventas" ADD CONSTRAINT "FK_5c564fe8d2b5182a37211405827" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ventas" ADD CONSTRAINT "FK_1cfc70b81ce44003e0fc57cbc4e" FOREIGN KEY ("movimiento_inventario_id") REFERENCES "movimientos_inventario"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "movimientos_caja" ADD CONSTRAINT "FK_c7d88d7f52c6aed186e13453082" FOREIGN KEY ("turno_id") REFERENCES "turnos_caja"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "movimientos_caja" ADD CONSTRAINT "FK_54e0399df650a63fc8896df47f8" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "turnos_caja" ADD CONSTRAINT "FK_5d508ba714f0abb333f7a26e9b6" FOREIGN KEY ("caja_id") REFERENCES "cajas"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "turnos_caja" ADD CONSTRAINT "FK_353eee20b1ce5f34c303f4b8267" FOREIGN KEY ("usuario_apertura_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "turnos_caja" ADD CONSTRAINT "FK_10f1735bdfff608528c1b879a9e" FOREIGN KEY ("usuario_cierre_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "turnos_caja" DROP CONSTRAINT "FK_10f1735bdfff608528c1b879a9e"`);
        await queryRunner.query(`ALTER TABLE "turnos_caja" DROP CONSTRAINT "FK_353eee20b1ce5f34c303f4b8267"`);
        await queryRunner.query(`ALTER TABLE "turnos_caja" DROP CONSTRAINT "FK_5d508ba714f0abb333f7a26e9b6"`);
        await queryRunner.query(`ALTER TABLE "movimientos_caja" DROP CONSTRAINT "FK_54e0399df650a63fc8896df47f8"`);
        await queryRunner.query(`ALTER TABLE "movimientos_caja" DROP CONSTRAINT "FK_c7d88d7f52c6aed186e13453082"`);
        await queryRunner.query(`ALTER TABLE "ventas" DROP CONSTRAINT "FK_1cfc70b81ce44003e0fc57cbc4e"`);
        await queryRunner.query(`ALTER TABLE "ventas" DROP CONSTRAINT "FK_5c564fe8d2b5182a37211405827"`);
        await queryRunner.query(`ALTER TABLE "ventas" DROP CONSTRAINT "FK_e72deb228c4cc8ba8d5ed9654d5"`);
        await queryRunner.query(`ALTER TABLE "ventas" DROP CONSTRAINT "FK_adc61de840b86c266fe58ee1b44"`);
        await queryRunner.query(`ALTER TABLE "tickets_venta" DROP CONSTRAINT "FK_6de4bfbe7692994e40bc282c573"`);
        await queryRunner.query(`ALTER TABLE "vueltos_venta" DROP CONSTRAINT "FK_dd9de97d477f994c2febc575286"`);
        await queryRunner.query(`ALTER TABLE "detalles_venta" DROP CONSTRAINT "FK_fd8bdc6f765b94dd3f81bad1ea9"`);
        await queryRunner.query(`ALTER TABLE "detalles_venta" DROP CONSTRAINT "FK_ab69c1a2f0343563b2905e1b926"`);
        await queryRunner.query(`ALTER TABLE "detalles_venta" DROP CONSTRAINT "FK_3ae9489835ca1a6c91b994e6324"`);
        await queryRunner.query(`ALTER TABLE "detalles_devolucion_venta" DROP CONSTRAINT "FK_68fc22cecff04df0456aab8f5a4"`);
        await queryRunner.query(`ALTER TABLE "detalles_devolucion_venta" DROP CONSTRAINT "FK_10952f6ab09de3378f0776714a9"`);
        await queryRunner.query(`ALTER TABLE "devoluciones_venta" DROP CONSTRAINT "FK_7326abeeaccceedccd31a5b42e2"`);
        await queryRunner.query(`ALTER TABLE "devoluciones_venta" DROP CONSTRAINT "FK_a7ab4264280bba73f6317bae926"`);
        await queryRunner.query(`ALTER TABLE "devoluciones_venta" DROP CONSTRAINT "FK_364bbdcc351a2ce5f2cce92021d"`);
        await queryRunner.query(`ALTER TABLE "devoluciones_venta" DROP CONSTRAINT "FK_561095838c0526ec086ae7c9158"`);
        await queryRunner.query(`ALTER TABLE "reintegros_venta" DROP CONSTRAINT "FK_a12f6ab4891a3d7333e4f293ff9"`);
        await queryRunner.query(`ALTER TABLE "pagos_venta" DROP CONSTRAINT "FK_463dd9a6f5a8957960c34e44572"`);
        await queryRunner.query(`ALTER TABLE "descuentos_venta" DROP CONSTRAINT "FK_e5a29b9fbfdda29bcb1c0bd84fe"`);
        await queryRunner.query(`ALTER TABLE "descuentos_venta" DROP CONSTRAINT "FK_796ff7c77b6dce926df4d42a441"`);
        await queryRunner.query(`ALTER TABLE "descuentos_venta" DROP CONSTRAINT "FK_cb07f19c04c7d95a93bd9d9e2f3"`);
        await queryRunner.query(`ALTER TABLE "descuentos_venta" DROP CONSTRAINT "FK_14ed97fd559efed0cf16f9fc543"`);
        await queryRunner.query(`ALTER TABLE "promociones" DROP CONSTRAINT "FK_223931a80391820c5b7ab740a56"`);
        await queryRunner.query(`ALTER TABLE "promociones" DROP CONSTRAINT "FK_0318319830d1d6cd54d16780572"`);
        await queryRunner.query(`DROP TABLE "configuracion_descuentos"`);
        await queryRunner.query(`DROP TABLE "cajas"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_turnos_caja_abiertos"`);
        await queryRunner.query(`DROP TABLE "turnos_caja"`);
        await queryRunner.query(`DROP TYPE "public"."tipo_cierre_caja"`);
        await queryRunner.query(`DROP TABLE "movimientos_caja"`);
        await queryRunner.query(`DROP TYPE "public"."tipo_movimiento_caja"`);
        await queryRunner.query(`DROP TABLE "ventas"`);
        await queryRunner.query(`DROP TYPE "public"."estado_venta"`);
        await queryRunner.query(`DROP TABLE "tickets_venta"`);
        await queryRunner.query(`DROP TABLE "vueltos_venta"`);
        await queryRunner.query(`DROP TABLE "detalles_venta"`);
        await queryRunner.query(`DROP TABLE "detalles_devolucion_venta"`);
        await queryRunner.query(`DROP TABLE "devoluciones_venta"`);
        await queryRunner.query(`DROP TYPE "public"."tipo_devolucion_venta"`);
        await queryRunner.query(`DROP TABLE "reintegros_venta"`);
        await queryRunner.query(`DROP TABLE "pagos_venta"`);
        await queryRunner.query(`DROP TYPE "public"."medio_pago_venta"`);
        await queryRunner.query(`DROP TABLE "descuentos_venta"`);
        await queryRunner.query(`DROP TYPE "public"."origen_descuento_venta"`);
        await queryRunner.query(`DROP TABLE "promociones"`);
        await queryRunner.query(`DROP TYPE "public"."tipo_descuento_promocion"`);
    }

}
