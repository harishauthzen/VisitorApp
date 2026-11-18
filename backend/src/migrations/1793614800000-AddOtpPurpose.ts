import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOtpPurpose1793614800000 implements MigrationInterface {
  name = 'AddOtpPurpose1793614800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "otp"
      ADD "purpose" character varying NOT NULL DEFAULT 'registration'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "otp"
      DROP COLUMN "purpose"
    `);
  }
}
