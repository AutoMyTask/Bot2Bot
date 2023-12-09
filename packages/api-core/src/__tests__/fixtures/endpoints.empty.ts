import { RequestCore, RouteCore } from "api-core-types";
import IRouteConventions = RouteCore.IRouteConventions;
import { expect } from "vitest";
import IRequestConventions = RequestCore.IRequestConventions;
import { RequestHandlerBuilder } from "../../request/request.handler.builder";
import { EndpointsController } from "./endpoints.controller";

export function expectEmptyRequestConvention(convention: IRequestConventions) {
  expect(convention.handlers.length).eq(2);
  expect(convention.params.path.length).eq(0);
  expect(convention.params.query.length).eq(0);
  expect(convention.params.body).an("undefined");
}

export function expectEmptyEndpointConvention(convention: IRouteConventions) {
  expectEmptyRequestConvention(convention.request);

  expect(convention.auth).an("undefined");
  expect(convention.prefixes.length).eq(0);
  expect(convention.middlewares.length).eq(0);
  expect(convention.metadataCollection.items.length).eq(0);
}

export function isEmptyEndpoint({ path, method, prefixes }: IRouteConventions) {
  return path === "/addEndpoint" && method === "get" && prefixes.length === 0;
}

export const emptyRequestHandlerBuilder = new RequestHandlerBuilder(
  EndpointsController,
  EndpointsController.emptyEndpoint,
);
