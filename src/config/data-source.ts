import { DataSource } from "typeorm";
require('dotenv').config()

export const AppDataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.POSTGRES_DB,
  synchronize: false,
  migrationsRun: false,
  entities: ["dist/entities/*.js"],
  migrations: ["dist/migrations/*.js"],
});
