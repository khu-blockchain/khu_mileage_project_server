import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1755678979333 implements MigrationInterface {
    name = 'Init1755678979333'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "mileage_point_history" ALTER COLUMN "transaction_status" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "mileage_point_history" ALTER COLUMN "transaction_status" SET NOT NULL`);
    }

}
