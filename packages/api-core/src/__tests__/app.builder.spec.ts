import { beforeAll, describe, expect, it } from "vitest";
import { AppBuilder } from "../app.builder";
import { AppCore } from "api-core-types";
import IAppBuilder = AppCore.IAppBuilder;
import { EmptyService } from "./fixtures/EmptyService";
import { App } from "../app";
import IApp = AppCore.IApp;

describe("app.builder", () => {
  let builder: IAppBuilder;

  beforeAll(() => {
    builder = AppBuilder.createAppBuilder();
  });

  describe("build", () => {
    it("should build an instance of App corresponding to IApp interface", function () {
      const app = builder.build();
      expect(app instanceof App).eq(true);
    });
  });

  describe("configure", () => {
    it("should add a service to dependency injection", function () {
      builder.configure((services) => {
        services.bind(EmptyService).to(EmptyService).inTransientScope();
      });
      const app = builder.build();
      expect(app.services.isBound(EmptyService)).eq(true);
    });
  });

  describe("addAuthentification", () => {
    it("should ", function () {
      const handler = (req, res, next) => {
        next();
      };

      builder.addAuthentification(
        (req, res, next) => {
          next();
        },
        ["bearer"], // Le soucis c'est comment vérifier que les schemes sont bien présent dans les convention ? Je le fait ici ?
      );
    });
  });
});
