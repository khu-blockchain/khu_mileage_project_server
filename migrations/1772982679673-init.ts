import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1772982679673 implements MigrationInterface {
    name = 'Init1772982679673'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."transaction_log_domain_enum" AS ENUM('STUDENT_REGISTER', 'ADMIN_REGISTER', 'MILEAGE_SUBMIT', 'MILEAGE_APPROVE', 'MILEAGE_REJECT', 'MILEAGE_MINT', 'MILEAGE_BURN', 'MILEAGE_TOKEN_CREATE', 'WALLET_CHANGE')`);
        await queryRunner.query(`CREATE TYPE "public"."transaction_log_stage_enum" AS ENUM('RECEIVED', 'VALIDATED', 'HASH_CALCULATED', 'BROADCAST', 'BROADCAST_FAILED')`);
        await queryRunner.query(`CREATE TABLE "transaction_log" ("id" SERIAL NOT NULL, "domain" "public"."transaction_log_domain_enum" NOT NULL, "domain_id" character varying NOT NULL, "stage" "public"."transaction_log_stage_enum" NOT NULL, "raw_transaction" text, "tx_hash" character varying, "error_message" text, "metadata" json, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c31d1e77795e3bd9d5f6399f988" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "transaction_log"`);
        await queryRunner.query(`DROP TYPE "public"."transaction_log_stage_enum"`);
        await queryRunner.query(`DROP TYPE "public"."transaction_log_domain_enum"`);
    }

}
