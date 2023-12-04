import { RouteCore } from "api-core-types";
import IRouteConventions = RouteCore.IRouteConventions;
import { expect } from "vitest";

export function expectEmptyEndpointConvention(convention: IRouteConventions) {
  expect(convention.auth).an("undefined");

  // Par défaut 2 middlewares. Un pour la création des params et l'autre pour l'exécution de
  // la requête final donc deux handlers
  expect(convention.request.handlers.length).eq(2);

  expect(convention.request.params.path.length).eq(0);
  expect(convention.request.params.body).an("undefined");
  expect(convention.request.params.query.length).eq(0);
  expect(convention.auth).an("undefined");
  expect(convention.prefixes.length).eq(0);
  expect(convention.middlewares.length).eq(0);
  expect(convention.metadataCollection.items.length).eq(0);
}

export class EndpointsController {
  static emptyEndpoint(): true {
    return true;
  }
}
