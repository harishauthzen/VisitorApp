import 'reflect-metadata';

import dotenv from 'dotenv';

dotenv.config({ path: '.env.migration' });

import { DataSource } from 'typeorm';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = dirname(currentFile);

const AppDataSource = new DataSource({
  type: 'postgres',

  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,

  // Load all entity files, not just the event entities.
  entities: [
    join(currentDirectory, '**', '*.entity{.ts,.js}'),
  ],

  migrations: [
    join(currentDirectory, 'migrations', '*{.ts,.js}'),
  ],

  synchronize: false,
});

export default AppDataSource;
