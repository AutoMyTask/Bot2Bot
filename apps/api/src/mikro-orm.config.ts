import {Options} from "@mikro-orm/core";
import {TsMorphMetadataProvider} from "@mikro-orm/reflection";
import {PostgreSqlDriver} from "@mikro-orm/postgresql";

const configDb: Options<PostgreSqlDriver> = {
    metadataProvider: TsMorphMetadataProvider,
    entities: ['./dist/entities'],
    entitiesTs: ['./src/entities'],
    dbName: process.env.POSTGRESQL_DB,
    port: Number.parseInt(process.env.POSTGRESQL_PORT ?? '0'),
    password: process.env.POSTGRESQL_PASSWORD,
    host: process.env.POSTGRESQL_HOST,
    user: process.env.POSTGRESQL_USER,
    type: 'postgresql'
}

export default configDb
