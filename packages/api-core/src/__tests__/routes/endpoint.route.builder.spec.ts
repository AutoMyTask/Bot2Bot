import { beforeAll, describe, expect, it } from "vitest";
import { EndpointRouteBuilder } from "../../routes/endpoint.route.builder";
import { AllowAnonymousAttribute } from "../../routes/metadata/AllowAnonymousAttribute";
import { AuthorizeAttribute } from "../../routes/metadata/AuthorizeAttribute";
import { emptyRequestHandlerBuilder } from "../fixtures/endpoints.empty";

// Créer une "classe, package, module" spécifique pour tester une route de bout en bout

// Avoir plusieurs fixures avec des fonctions helpers d'assertions associés
// que je pourrais réutiliser partout dans mes tests
describe("EndpointRouteBuilder", () => {
  let emptyEndpointRouteBuilder: EndpointRouteBuilder;
  beforeAll(() => {
    emptyEndpointRouteBuilder = new EndpointRouteBuilder(
      emptyRequestHandlerBuilder,
      "/emptyEndpoint",
      "get",
    );
  });

  describe("constructor", () => {
    it("should throw an exception for invalid route format ", function () {
      const path = "invalidRoute";
      expect(
        () => new EndpointRouteBuilder(emptyRequestHandlerBuilder, path, "get"),
      ).to.throw(
        `Invalid route format for '${path}'. Please use '/{string}/...' format.`,
      );

      // A voir pour d'autre cas d'invalidation
    });
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

  describe("withMiddleware", () => {
    it("should add middleware", function () {
      const emptyMiddleware = (req, res, next) => {
        next();
      };
      emptyEndpointRouteBuilder.withMiddleware(emptyMiddleware);
      expect(emptyEndpointRouteBuilder.middlewares.length).eq(1);
      expect(
        emptyEndpointRouteBuilder.middlewares.some(
          (middleware) => middleware === emptyMiddleware,
        ),
      ).eq(true);
    });
  });
});
