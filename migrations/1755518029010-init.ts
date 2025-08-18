import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1755518029010 implements MigrationInterface {
    name = 'Init1755518029010'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."mileage_point_history_transaction_status_enum" AS ENUM('PROCESSING', 'CONFIRMED', 'FAILED')`);
        await queryRunner.query(`ALTER TABLE "mileage_point_history" ADD "transaction_status" "public"."mileage_point_history_transaction_status_enum" NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "mileage_point_history" DROP COLUMN "transaction_status"`);
        await queryRunner.query(`DROP TYPE "public"."mileage_point_history_transaction_status_enum"`);
    }

}
