"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
require('dotenv').config();
exports.AppDataSource = new typeorm_1.DataSource({
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
//# sourceMappingURL=data-source.js.map