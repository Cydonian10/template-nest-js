import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1791125565246 implements MigrationInterface {
    name = 'Init1791125565246'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "persons" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "first_name" character varying(100) NOT NULL, "last_name" character varying(100) NOT NULL, "date_of_birth" date NOT NULL, "identity_document" character varying NOT NULL, "active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_74278d8812a049233ce41440ac7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "email_normalized" character varying NOT NULL, "nick_name" character varying NOT NULL, "nick_name_normalized" character varying NOT NULL, "password_hash" character varying NOT NULL, "email_verification_token" character varying, "email_verified" boolean NOT NULL DEFAULT false, "active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "persona_id" uuid NOT NULL, CONSTRAINT "UQ_5a42435a9cd1daeec3adbb42636" UNIQUE ("email_normalized"), CONSTRAINT "UQ_f1c7d50b455fb6fef2fabd72930" UNIQUE ("nick_name_normalized"), CONSTRAINT "REL_7c0fe0208862aee6f27167a2c0" UNIQUE ("persona_id"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "valid_from" date NOT NULL, "valid_until" date, "role_id" uuid NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "PK_8acd5cf26ebd158416f477de799" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "systems" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying(50) NOT NULL, "name" character varying NOT NULL, "description" text NOT NULL, "active" boolean NOT NULL DEFAULT true, "order" numeric(10,2) NOT NULL DEFAULT '0', CONSTRAINT "UQ_systems_code" UNIQUE ("code"), CONSTRAINT "PK_aec3139aedeb09c5ae27f2c94d3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying(50) NOT NULL, "name" character varying(100) NOT NULL, "description" text NOT NULL, "system_id" uuid NOT NULL, CONSTRAINT "UQ_f6d54f95c31b73fb1bdd8e91d0c" UNIQUE ("code"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "role_permissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "active" boolean NOT NULL DEFAULT true, "role_id" uuid NOT NULL, "permission_id" uuid NOT NULL, CONSTRAINT "PK_84059017c90bfcb701b8fa42297" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "permissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "resource_code" character varying NOT NULL, "action_code" character varying NOT NULL, "code" character varying NOT NULL, "system_id" uuid NOT NULL, CONSTRAINT "UQ_permissions_system_code" UNIQUE ("system_id", "code"), CONSTRAINT "UQ_permissions_system_resource_action" UNIQUE ("system_id", "resource_code", "action_code"), CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_users_persona" FOREIGN KEY ("persona_id") REFERENCES "persons"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_user_roles_role" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_user_roles_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "roles" ADD CONSTRAINT "FK_roles_system" FOREIGN KEY ("system_id") REFERENCES "systems"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_role_permissions_role" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_role_permissions_permission" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "permissions" ADD CONSTRAINT "FK_permissions_system" FOREIGN KEY ("system_id") REFERENCES "systems"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "permissions" DROP CONSTRAINT "FK_permissions_system"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_role_permissions_permission"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_role_permissions_role"`);
        await queryRunner.query(`ALTER TABLE "roles" DROP CONSTRAINT "FK_roles_system"`);
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_user_roles_user"`);
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_user_roles_role"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_users_persona"`);
        await queryRunner.query(`DROP TABLE "permissions"`);
        await queryRunner.query(`DROP TABLE "role_permissions"`);
        await queryRunner.query(`DROP TABLE "roles"`);
        await queryRunner.query(`DROP TABLE "systems"`);
        await queryRunner.query(`DROP TABLE "user_roles"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "persons"`);
    }

}
