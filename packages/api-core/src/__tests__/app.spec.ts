import { beforeAll, describe, expect, it } from "vitest";
import { AppCore, RouteCore } from "api-core-types";
import IApp = AppCore.IApp;
import { AppBuilder } from "../app.builder";
import { EndpointsController } from "./fixtures/endpoints.controller";
import {
  expectEmptyEndpointConvention,
  isEmptyEndpoint,
} from "./fixtures/endpoints.empty";

// Peut-être créer des parambuilder spécifiques aux different type de params ?
// à voir. Manque le test d'app avec l'ajout des metadatatas. Mais cela
// correspond plus à des tests d'intégration

describe("app", () => {
  let app: IApp;

  beforeAll(() => {
    const builder = AppBuilder.createAppBuilder();
    app = builder.build();
  });

  describe("IApp", () => {
    describe("addEndpoints", () => {
      it("should add convention to IRouteConventions array", function () {
        app.addEndpoints((routeMapBuilder) => {
          routeMapBuilder.map(
            "/addEndpoint",
            "get",
            EndpointsController,
            EndpointsController.emptyEndpoint,
          );
          return routeMapBuilder;
        });

        expect(app.conventions.length).eq(1);

        const convention = app.conventions.find(isEmptyEndpoint);
        expectEmptyEndpointConvention(convention);
      });
    });
  });
});
