import { TsMorphMetadataProvider } from "@mikro-orm/reflection";
import { Options } from "@mikro-orm/postgresql";

const configDb: Options = {
  metadataProvider: TsMorphMetadataProvider,
  entities: ["./dist/users/entities"],
  entitiesTs: ["./src/users/entities"],
  dbName: process.env.POSTGRES_DB,
  port: Number.parseInt(process.env.POSTGRES_PORT ?? "0"),
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  user: process.env.POSTGRES_USER,
  type: "postgresql",
  migrations: {
    disableForeignKeys: false,
  },
};

export default configDb;
