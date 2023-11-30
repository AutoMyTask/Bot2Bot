import { Configuration, MikroORM } from "@mikro-orm/core";
import { Options, PostgreSqlDriver } from "@mikro-orm/postgresql";
import { IServiceCollection } from "api-core-types";

export const configureDb =
  (config: Options | Configuration<PostgreSqlDriver>) =>
  (services: IServiceCollection): void => {
    services
      .bind(MikroORM<PostgreSqlDriver>)
      .toDynamicValue(async () => {
        return await MikroORM.init<PostgreSqlDriver>(config);
      })
      .inSingletonScope();
  };
