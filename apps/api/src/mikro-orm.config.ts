import {Options} from "@mikro-orm/core";
import {TsMorphMetadataProvider} from "@mikro-orm/reflection";
import {PostgreSqlDriver} from "@mikro-orm/postgresql";

const configDb: Options<PostgreSqlDriver> = {
    metadataProvider: TsMorphMetadataProvider,
    entities: [
        './dist/users/entities'
    ],
    entitiesTs: [
        './src/users/entities'
    ],
    dbName: process.env.POSTGRESQL_DB,
    port: Number.parseInt(process.env.POSTGRESQL_PORT ?? '0'),
    password: process.env.POSTGRESQL_PASSWORD,
    host: process.env.POSTGRESQL_HOST,
    user: process.env.POSTGRESQL_USER,
    type: 'postgresql',
    migrations: {
        disableForeignKeys: false
    }
}

export default configDb
