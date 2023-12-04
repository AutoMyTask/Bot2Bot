import { beforeAll, describe, it } from "vitest";
import { EndpointRouteBuilder } from "../../routes/endpoint.route.builder";
import { RequestHandlerBuilder } from "../../request/request.handler.builder";
import { EndpointsController } from "../fixtures/endpoints";

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
  describe("IEndpointRouteBuilder", () => {
    it("should ", function () {});
  });
});
