import { AppCore } from "api-core-types";
import { MikroORM, RequestContext } from "@mikro-orm/core";
import { PostgreSqlDriver } from "@mikro-orm/postgresql";

export const requestContext = (app: AppCore.IApp) => {
  app.app.use(async (req, res, next) => {
    const orm = await req.services.getAsync(MikroORM<PostgreSqlDriver>);
    RequestContext.create(orm.em, next);
  });
};
