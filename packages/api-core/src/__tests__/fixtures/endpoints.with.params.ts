import { RequestHandlerBuilder } from "../../request/request.handler.builder";
import { EndpointsController } from "./endpoints.controller";

export const getWithParamsRequestHandlerBuilder = new RequestHandlerBuilder(
  EndpointsController,
  EndpointsController.endpointGetWithParams,
);
