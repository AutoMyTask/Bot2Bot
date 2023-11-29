import { Params, Query } from "api-core";
import { RouteCore } from "api-core-types";

export class EndpointsController {
  static testParamsWithFormat(
    @Params("paramInt", "int") paramInt: number,
    @Params("paramNumber") paramNumber: number,
    @Query("queryStringRequired") queryStringRequired: string,
    @Query("queryParamNumber") queryNumber: number,
    @Query("queryStringNotRequired", { required: false })
    queryStringNotRequired?: string,
  ): boolean {
    return true;
  }
}

export const endpoints = (routeMapBuilder: RouteCore.IRouteMapBuilder) => {
  routeMapBuilder.map(
    "/path/:paramInt/:paramNumber",
    "get",
    EndpointsController,
    EndpointsController.testParamsWithFormat,
  );

  return routeMapBuilder;
};
