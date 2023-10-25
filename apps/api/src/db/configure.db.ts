import {MikroORM} from "@mikro-orm/core";
import {PostgreSqlDriver} from "@mikro-orm/postgresql";
import {ConfigureServiceCallback, IServiceCollection} from "api-core-types";
import configDb from "../mikro-orm.config";

export const configureDb: ConfigureServiceCallback = (services: IServiceCollection): void => {
    services.bind(MikroORM<PostgreSqlDriver>).toDynamicValue((async () => {
        return await MikroORM.init<PostgreSqlDriver>(configDb)
    })).inSingletonScope()
}
