import { beforeAll, describe, expect, it } from "vitest";
import { AppBuilder } from "../app.builder";
import { AppCore } from "api-core-types";
import IAppBuilder = AppCore.IAppBuilder;
import { EmptyService } from "./fixtures/EmptyService";
import { App } from "../app";
import { AuthentificationBuilder } from "../auth/authentification.builder";
import e, { Handler } from "express";

// Se baser sur cela pour concevoir l'ajout de l'authentification
// https://devblogs.microsoft.com/dotnet/whats-new-with-identity-in-dotnet-8/?utm_source=csharpdigest&utm_medium&utm_campaign=1732

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
    let handler: Handler;
    let onTokenValidated: Handler;

    beforeAll(() => {
      handler = (req, res, next) => {
        next();
      };
      onTokenValidated = (req, res, next) => {
        console.log("onTokenValidated");
        next();
      };
      builder.addAuthentification(handler, ["bearer"], (builder) => {
        builder.onTokenValidated = onTokenValidated;
      });
    });

    it("should correctly configure and add authentication to the app", function () {
      const app = builder.build();
      expect(app.services.isBound(AuthentificationBuilder)).eq(true);
      expect(app.services.get(AuthentificationBuilder).handler).eq(handler);
      expect(app.services.get(AuthentificationBuilder).onTokenValidated).eq(
        onTokenValidated,
      );
    });
  });
});
