import type { MigrationInterface, QueryRunner } from 'typeorm';

export class MarcasCategoriasProductos1791690118255 implements MigrationInterface {
  name = 'MarcasCategoriasProductos1791690118255';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Impide inserciones entre la comprobación y el nuevo marca_id NOT NULL.
    await queryRunner.query(`LOCK TABLE "productos" IN ACCESS EXCLUSIVE MODE`);
    const [producto] = (await queryRunner.query(
      `SELECT EXISTS (SELECT 1 FROM "productos") AS "existen"`,
    )) as { existen: boolean }[];
    if (producto.existen) {
      throw new Error(
        'La migración de marcas y categorías requiere productos vacíos. Reinicia manualmente solo la base de desarrollo tras verificar y respaldar sus datos.',
      );
    }

    await queryRunner.query(
      `CREATE TABLE "marcas" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nombre" character varying(200) NOT NULL, "activo" boolean NOT NULL DEFAULT true, "imagen_id" uuid, CONSTRAINT "PK_marcas" PRIMARY KEY ("id"), CONSTRAINT "UQ_marcas_imagen_id" UNIQUE ("imagen_id"), CONSTRAINT "CHK_marcas_nombre" CHECK (length(btrim("nombre")) BETWEEN 1 AND 200))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_marcas_nombre_normalizado" ON "marcas" (lower(btrim("nombre")))`,
    );
    await queryRunner.query(
      `ALTER TABLE "marcas" ADD CONSTRAINT "FK_marcas_imagen" FOREIGN KEY ("imagen_id") REFERENCES "imagenes"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TABLE "categorias" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nombre" character varying(200) NOT NULL, "descripcion" text, "activo" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_categorias" PRIMARY KEY ("id"), CONSTRAINT "CHK_categorias_nombre" CHECK (length(btrim("nombre")) BETWEEN 1 AND 200))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_categorias_nombre_normalizado" ON "categorias" (lower(btrim("nombre")))`,
    );

    await queryRunner.query(
      `ALTER TABLE "productos" ADD "marca_id" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "productos" ADD CONSTRAINT "FK_productos_marca" FOREIGN KEY ("marca_id") REFERENCES "marcas"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_productos_marca_id" ON "productos" ("marca_id")`,
    );
    await queryRunner.query(
      `CREATE TABLE "productos_categorias" ("producto_id" uuid NOT NULL, "categoria_id" uuid NOT NULL, CONSTRAINT "PK_productos_categorias" PRIMARY KEY ("producto_id", "categoria_id"), CONSTRAINT "FK_productos_categorias_producto" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE NO ACTION, CONSTRAINT "FK_productos_categorias_categoria" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_productos_categorias_categoria_id" ON "productos_categorias" ("categoria_id")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "productos_categorias"`);
    await queryRunner.query(`DROP INDEX "IDX_productos_marca_id"`);
    await queryRunner.query(
      `ALTER TABLE "productos" DROP CONSTRAINT "FK_productos_marca"`,
    );
    await queryRunner.query(`ALTER TABLE "productos" DROP COLUMN "marca_id"`);
    await queryRunner.query(`DROP TABLE "categorias"`);
    await queryRunner.query(`DROP TABLE "marcas"`);
  }
}
