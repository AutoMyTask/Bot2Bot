import { RouteCore } from "api-core-types";
import IRouteMapBuilder = RouteCore.IRouteMapBuilder;

class HealthcheckController {
  public static healthcheck(): boolean {
    return true;
  }
}

export const healthcheckEndpoint = (routeMapBuilder: IRouteMapBuilder) => {
  routeMapBuilder
    .map(
      "/healthcheck",
      "get",
      HealthcheckController,
      HealthcheckController.healthcheck,
    )
    .allowAnonymous();

  return routeMapBuilder;
};
