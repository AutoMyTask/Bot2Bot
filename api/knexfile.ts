import type {Knex} from "knex";
import dotenv from "dotenv";

dotenv.config()

const config: Knex.Config = {
    client: "pg",
    connection: {
        database: process.env.POSTGRESQL_DB,
        user: process.env.POSTGRESQL_USER,
        password: process.env.POSTGRESQL_PASSWORD,
        host: process.env.POSTGRESQL_HOST,
        port: Number(process.env.POSTGRESQL_PORT),

    },
    pool: {
        min: 2,
        max: 10
    },
    migrations: {
        tableName: "knex_migrations",
        directory: './src/database/migrations'
    }

};

export default config;
