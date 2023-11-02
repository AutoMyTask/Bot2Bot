import {MikroORM} from "@mikro-orm/core";
import {PostgreSqlDriver} from "@mikro-orm/postgresql";
import {IServiceCollection} from "api-core-types";

export const configureDb = (config: any) => (services: IServiceCollection): void => {
    services.bind(MikroORM<PostgreSqlDriver>).toDynamicValue((async () => {
        return await MikroORM.init<PostgreSqlDriver>(config)
    })).inSingletonScope()
}
