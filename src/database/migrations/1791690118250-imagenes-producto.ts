import type { MigrationInterface, QueryRunner } from 'typeorm';

export class ImagenesProducto1791690118250 implements MigrationInterface {
  name = 'ImagenesProducto1791690118250';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "imagenes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "clave_almacenamiento" character varying(500) NOT NULL, "proveedor" character varying(50) NOT NULL, "tipo_mime" character varying(100) NOT NULL, "tamano_bytes" integer NOT NULL, "nombre_original" character varying(255) NOT NULL, "fecha_subida" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_imagenes_clave_almacenamiento" UNIQUE ("clave_almacenamiento"), CONSTRAINT "CHK_imagenes_tamano_positivo" CHECK ("tamano_bytes" > 0), CONSTRAINT "PK_imagenes" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "producto_imagenes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "orden" integer NOT NULL DEFAULT 0, "producto_id" uuid NOT NULL, "imagen_id" uuid NOT NULL, CONSTRAINT "UQ_producto_imagenes_producto_imagen" UNIQUE ("producto_id", "imagen_id"), CONSTRAINT "PK_producto_imagenes" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_producto_imagenes_producto_id" ON "producto_imagenes" ("producto_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "producto_imagenes" ADD CONSTRAINT "FK_producto_imagenes_producto" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "producto_imagenes" ADD CONSTRAINT "FK_producto_imagenes_imagen" FOREIGN KEY ("imagen_id") REFERENCES "imagenes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "producto_imagenes" DROP CONSTRAINT "FK_producto_imagenes_imagen"`,
    );
    await queryRunner.query(
      `ALTER TABLE "producto_imagenes" DROP CONSTRAINT "FK_producto_imagenes_producto"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_producto_imagenes_producto_id"`);
    await queryRunner.query(`DROP TABLE "producto_imagenes"`);
    await queryRunner.query(`DROP TABLE "imagenes"`);
  }
}
