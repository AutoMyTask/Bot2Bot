import { beforeAll, describe, expect, it } from "vitest";
import { AppCore, RouteCore } from "api-core-types";
import IApp = AppCore.IApp;
import { AppBuilder } from "../app.builder";
import { EndpointsController } from "./fixtures/endpoints";
import IRouteConventions = RouteCore.IRouteConventions;
import { App } from "../app";
import { ap } from "vitest/dist/reporters-5f784f42";
import IRouteMapBuilder = RouteCore.IRouteMapBuilder;

// Peut être créer des parambuilder spécifique aux different type de params ?
// a voir

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
      });
    });

    describe("IRouteMapBuilder", () => {
      it("should be an instance of App corresponding to IRouteMapBuilder interface", function () {
        let iRouteMapBuilder: IRouteMapBuilder;
        app.addEndpoints((routeMapBuilder) => {
          iRouteMapBuilder = routeMapBuilder;
          return routeMapBuilder;
        });

        expect(iRouteMapBuilder instanceof App).eq(true);
      });
    });
  });
});
