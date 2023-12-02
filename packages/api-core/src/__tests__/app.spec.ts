import { beforeAll, describe, expect, it } from "vitest";
import { AppCore, RouteCore } from "api-core-types";
import IApp = AppCore.IApp;
import { AppBuilder } from "../app.builder";
import { EndpointsController } from "./fixtures/endpoints";
import IRouteConventions = RouteCore.IRouteConventions;

describe("app", () => {
  let app: IApp;

  beforeAll(() => {
    const builder = AppBuilder.createAppBuilder();
    app = builder.build();
  });

  describe("IApp", () => {
    describe("addEndpoints", () => {
      it("should add get convention to IRouteConventions array", function () {
        app.addEndpoints((routeMapBuilder) => {
          routeMapBuilder.map(
            "/addEndpoint",
            "get",
            EndpointsController,
            EndpointsController.getAddEndpoint,
          );
          return routeMapBuilder;
        });

        expect(app.conventions.length).eq(1);

        const convention = app.conventions.find(
          ({ path, method, prefixes }: IRouteConventions) =>
            path === "/addEndpoint" &&
            method === "get" &&
            prefixes.length === 0,
        );

        expect(convention.auth).an("undefined");

        // Dans requestHandlerBuilder, je crée un middleware pour la construction des params
        // et un autre pour exécuter la requête final. Est-ce que je rajoute la construction
        // des params si pas de params ? (build(): IRequestConventions)
        expect(convention.request.handlers.length).eq(2);
      });
    });
  });
});
