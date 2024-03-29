import { UserController } from "./user.controller";
import { UserResponse } from "./ressources/UserResponse";
import { Unauthorized } from "../http/errors/Unauthorized";
import { BadRequest } from "../http/errors/BadRequest";
import { RouteCore } from "api-core-types";
import { MetadataProduce, MetadataTag } from "openapi";
import { StatutCodes } from "api-core";

export const userEndpoints = (routeMapBuilder: RouteCore.IRouteMapBuilder) => {
  const userGroup = routeMapBuilder
    .mapGroup("/users")
    .withMetadata(new MetadataTag("Users"));

  userGroup
    .map("/@me/:id", "get", UserController, UserController.me)
    .withMetadata(
      new MetadataProduce(UserResponse),
      new MetadataProduce(Unauthorized, StatutCodes.Status401Unauthorized),
      new MetadataProduce(BadRequest, StatutCodes.Status400BadRequest),
    );

  return routeMapBuilder;
};
