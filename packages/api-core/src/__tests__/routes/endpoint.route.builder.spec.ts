import { beforeAll, describe, expect, it } from "vitest";
import { EndpointRouteBuilder } from "../../routes/endpoint.route.builder";
import { RequestHandlerBuilder } from "../../request/request.handler.builder";
import { EndpointsController } from "../fixtures/endpoints";
import { AllowAnonymousAttribute } from "../../routes/metadata/AllowAnonymousAttribute";
import { AuthorizeAttribute } from "../../routes/metadata/AuthorizeAttribute";

// Avoir plusieurs fixures avec des fonctions helpers d'assertions
// que je pourrais réutiliser partout dans mes tests
describe("EndpointRouteBuilder", () => {
  let emptyEndpointRouteBuilder: EndpointRouteBuilder;
  beforeAll(() => {
    emptyEndpointRouteBuilder = new EndpointRouteBuilder(
      new RequestHandlerBuilder(
        EndpointsController,
        EndpointsController.emptyEndpoint,
      ),
      "/emptyEndpoint",
      "get",
    );
  });
  describe("allowAnonymous", () => {
    it("should add AllowAnonymousAttribute and remove AuthorizeAttribute", function () {
      emptyEndpointRouteBuilder.requireAuthorization();
      emptyEndpointRouteBuilder.allowAnonymous();
      const convention = emptyEndpointRouteBuilder.buildRouteConventions()[0];
      expect(
        convention.metadataCollection.items.some(
          (metadata) => metadata instanceof AllowAnonymousAttribute,
        ),
      ).eq(true);
      expect(
        convention.metadataCollection.items.some(
          (metadata) => metadata instanceof AuthorizeAttribute,
        ),
      ).eq(false);
    });
  });

  describe("requireAuthorization", () => {
    it("should add AuthorizeAttribute and remove AllowAnonymousAttribute", function () {
      emptyEndpointRouteBuilder.allowAnonymous();
      emptyEndpointRouteBuilder.requireAuthorization();
      const convention = emptyEndpointRouteBuilder.buildRouteConventions()[0];
      expect(
        convention.metadataCollection.items.some(
          (metadata) => metadata instanceof AuthorizeAttribute,
        ),
      ).eq(true);
      expect(
        convention.metadataCollection.items.some(
          (metadata) => metadata instanceof AllowAnonymousAttribute,
        ),
      ).eq(false);
    });
  });
});
