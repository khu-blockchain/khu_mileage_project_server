import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1755713174506 implements MigrationInterface {
    name = 'Init1755713174506'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."mileage_token_transaction_status_enum" AS ENUM('PROCESSING', 'CONFIRMED', 'FAILED')`);
        await queryRunner.query(`CREATE TABLE "mileage_token" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" character varying NOT NULL, "contract_address" character varying, "symbol" character varying NOT NULL, "image_url" character varying NOT NULL, "transaction_status" "public"."mileage_token_transaction_status_enum" NOT NULL DEFAULT 'PROCESSING', "transaction_hash" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d7a7add8f17ee14570c5c1008d7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."wallet_lost_status_enum" AS ENUM('CREATED', 'APPROVED')`);
        await queryRunner.query(`CREATE TYPE "public"."wallet_lost_transaction_status_enum" AS ENUM('PROCESSING', 'CONFIRMED', 'FAILED')`);
        await queryRunner.query(`CREATE TABLE "wallet_lost" ("id" SERIAL NOT NULL, "student_id" character varying(10) NOT NULL, "student_name" character varying NOT NULL, "student_hash" character varying NOT NULL, "previous_wallet_address" character varying NOT NULL, "request_wallet_address" character varying NOT NULL, "status" "public"."wallet_lost_status_enum" NOT NULL DEFAULT 'CREATED', "transaction_status" "public"."wallet_lost_transaction_status_enum", "transaction_hash" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_cd2df98dcdd3d86a9c5db286b5f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "block" ("key" character varying NOT NULL DEFAULT 'last_processed_block', "block_number" character varying(256) NOT NULL DEFAULT '0', CONSTRAINT "PK_81610840e074034e5656a5e6555" PRIMARY KEY ("key"))`);
        await queryRunner.query(`CREATE TYPE "public"."event_logs_status_enum" AS ENUM('PENDING', 'CONFIRMED', 'FAILED')`);
        await queryRunner.query(`CREATE TABLE "event_logs" ("id" SERIAL NOT NULL, "transaction_hash" character varying NOT NULL, "log_index" integer NOT NULL, "block_number" integer NOT NULL, "event_name" character varying NOT NULL, "data" json NOT NULL, "status" "public"."event_logs_status_enum" NOT NULL DEFAULT 'PENDING', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b09cf1bb58150797d898076b242" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_1108c2c3f626ca38ac867a3fab" ON "event_logs" ("transaction_hash", "log_index") `);
        await queryRunner.query(`CREATE TYPE "public"."mileage_point_history_type_enum" AS ENUM('MILEAGE_APPROVED', 'MILEAGE_MINTED', 'MILEAGE_BURNED')`);
        await queryRunner.query(`CREATE TYPE "public"."mileage_point_history_transaction_status_enum" AS ENUM('PROCESSING', 'CONFIRMED', 'FAILED')`);
        await queryRunner.query(`CREATE TABLE "mileage_point_history" ("id" SERIAL NOT NULL, "type" "public"."mileage_point_history_type_enum" NOT NULL, "mileage_token_name" character varying NOT NULL, "mileage_activity_name" character varying NOT NULL, "mileage_category_name" character varying NOT NULL, "mileage_point" integer NOT NULL, "transaction_hash" character varying NOT NULL, "transaction_status" "public"."mileage_point_history_transaction_status_enum", "note" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "mileage_id" integer, CONSTRAINT "PK_7740822400a93e63ee4ea8319c5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "mileage_category" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" character varying NOT NULL, "created_at" TIMESTAMP DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), CONSTRAINT "PK_cc9a12056e3187072ec86a05638" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."mileage_activity_point_type_enum" AS ENUM('FIXED', 'OPTIONAL')`);
        await queryRunner.query(`CREATE TABLE "mileage_activity" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "point_type" "public"."mileage_activity_point_type_enum" NOT NULL DEFAULT 'OPTIONAL', "point_description" text, "fixed_point" integer, "mileage_category_id" integer, CONSTRAINT "PK_b37589e6262870f9ea733ec69fb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "mileage_file" ("id" SERIAL NOT NULL, "original_file_name" character varying NOT NULL, "stored_file_name" character varying NOT NULL, "url" character varying NOT NULL, "created_at" TIMESTAMP DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "mileage_id" integer, CONSTRAINT "PK_be6248f76ed373199b1c6f5eec5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."mileage_status_enum" AS ENUM('REVIEWING', 'REJECTED', 'APPROVED')`);
        await queryRunner.query(`CREATE TYPE "public"."mileage_transaction_status_enum" AS ENUM('PROCESSING', 'CONFIRMED', 'FAILED')`);
        await queryRunner.query(`CREATE TABLE "mileage" ("id" SERIAL NOT NULL, "mileage_category_name" character varying NOT NULL, "mileage_activity_name" character varying NOT NULL, "mileage_description" text NOT NULL, "admin_comment" character varying, "doc_index" integer, "doc_hash" character varying, "status" "public"."mileage_status_enum" NOT NULL DEFAULT 'REVIEWING', "transaction_status" "public"."mileage_transaction_status_enum" NOT NULL DEFAULT 'PROCESSING', "transaction_hash" character varying, "created_at" TIMESTAMP DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "student_id" character varying(10), "mileage_activity_id" integer, CONSTRAINT "PK_e8471e5c96e97d5933b5ccd7caa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."student_transaction_status_enum" AS ENUM('PROCESSING', 'CONFIRMED', 'FAILED')`);
        await queryRunner.query(`CREATE TABLE "student" ("student_id" character varying(10) NOT NULL, "name" character varying(10) NOT NULL, "password" character varying NOT NULL, "email" character varying NOT NULL, "department" character varying NOT NULL, "wallet_address" character varying NOT NULL, "bank_account_number" character varying NOT NULL, "bank_code" character varying NOT NULL, "personal_information_consent" boolean NOT NULL, "personal_information_consent_date" TIMESTAMP NOT NULL, "transaction_status" "public"."student_transaction_status_enum" NOT NULL DEFAULT 'PROCESSING', "student_hash" character varying, "transaction_hash" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_be3689991c2cc4b6f4cf39087fa" PRIMARY KEY ("student_id"))`);
        await queryRunner.query(`CREATE TYPE "public"."admin_transaction_status_enum" AS ENUM('PROCESSING', 'CONFIRMED', 'FAILED')`);
        await queryRunner.query(`CREATE TABLE "admin" ("admin_id" character varying NOT NULL, "name" character varying NOT NULL, "password" character varying NOT NULL, "email" character varying NOT NULL, "wallet_address" character varying NOT NULL, "transaction_status" "public"."admin_transaction_status_enum" NOT NULL DEFAULT 'PROCESSING', "transaction_hash" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_824467f7625447873d90f0db369" UNIQUE ("wallet_address"), CONSTRAINT "PK_08603203f2c50664bda27b1ff89" PRIMARY KEY ("admin_id"))`);
        await queryRunner.query(`ALTER TABLE "mileage_point_history" ADD CONSTRAINT "FK_6a91177db4b434b19400a9e2d90" FOREIGN KEY ("mileage_id") REFERENCES "mileage"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "mileage_activity" ADD CONSTRAINT "FK_8608677f3d1b1be6a2d43c43e78" FOREIGN KEY ("mileage_category_id") REFERENCES "mileage_category"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "mileage_file" ADD CONSTRAINT "FK_9675b5122d087bb96f4d6458e67" FOREIGN KEY ("mileage_id") REFERENCES "mileage"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "mileage" ADD CONSTRAINT "FK_ed420ef887ad99fe77338893767" FOREIGN KEY ("student_id") REFERENCES "student"("student_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "mileage" ADD CONSTRAINT "FK_a05eb903057cd42719ec6e3a662" FOREIGN KEY ("mileage_activity_id") REFERENCES "mileage_activity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "mileage" DROP CONSTRAINT "FK_a05eb903057cd42719ec6e3a662"`);
        await queryRunner.query(`ALTER TABLE "mileage" DROP CONSTRAINT "FK_ed420ef887ad99fe77338893767"`);
        await queryRunner.query(`ALTER TABLE "mileage_file" DROP CONSTRAINT "FK_9675b5122d087bb96f4d6458e67"`);
        await queryRunner.query(`ALTER TABLE "mileage_activity" DROP CONSTRAINT "FK_8608677f3d1b1be6a2d43c43e78"`);
        await queryRunner.query(`ALTER TABLE "mileage_point_history" DROP CONSTRAINT "FK_6a91177db4b434b19400a9e2d90"`);
        await queryRunner.query(`DROP TABLE "admin"`);
        await queryRunner.query(`DROP TYPE "public"."admin_transaction_status_enum"`);
        await queryRunner.query(`DROP TABLE "student"`);
        await queryRunner.query(`DROP TYPE "public"."student_transaction_status_enum"`);
        await queryRunner.query(`DROP TABLE "mileage"`);
        await queryRunner.query(`DROP TYPE "public"."mileage_transaction_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."mileage_status_enum"`);
        await queryRunner.query(`DROP TABLE "mileage_file"`);
        await queryRunner.query(`DROP TABLE "mileage_activity"`);
        await queryRunner.query(`DROP TYPE "public"."mileage_activity_point_type_enum"`);
        await queryRunner.query(`DROP TABLE "mileage_category"`);
        await queryRunner.query(`DROP TABLE "mileage_point_history"`);
        await queryRunner.query(`DROP TYPE "public"."mileage_point_history_transaction_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."mileage_point_history_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1108c2c3f626ca38ac867a3fab"`);
        await queryRunner.query(`DROP TABLE "event_logs"`);
        await queryRunner.query(`DROP TYPE "public"."event_logs_status_enum"`);
        await queryRunner.query(`DROP TABLE "block"`);
        await queryRunner.query(`DROP TABLE "wallet_lost"`);
        await queryRunner.query(`DROP TYPE "public"."wallet_lost_transaction_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."wallet_lost_status_enum"`);
        await queryRunner.query(`DROP TABLE "mileage_token"`);
        await queryRunner.query(`DROP TYPE "public"."mileage_token_transaction_status_enum"`);
    }

}
