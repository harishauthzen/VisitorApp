
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTrashAndHistory1792567456126
  implements MigrationInterface
{
  name = 'AddTrashAndHistory1792567456126';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "event_registrations" AS r
      SET "eventNameSnapshot" = e."name"
      FROM "events" AS e
      WHERE r."event_id" = e."id"
        AND r."eventNameSnapshot" IS NULL
    `);

    await queryRunner.query(`
      UPDATE "event_registrations" AS r
      SET
        "passNameSnapshot" = p."name",
        "passPriceSnapshot" = p."price"
      FROM "event_passes" AS p
      WHERE r."pass_id" = p."id"
        AND (
          r."passNameSnapshot" IS NULL
          OR r."passPriceSnapshot" IS NULL
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
  }
}
