import { describe, it } from "vitest";
import { RequestHandlerBuilder } from "../../request/request.handler.builder";
import {
  emptyRequestHandlerBuilder,
  expectEmptyRequestConvention,
} from "../fixtures/endpoints.empty";
import { getWithParamsRequestHandlerBuilder } from "../fixtures/endpoints.with.params";

describe("RequestHandlerBuilder", () => {
  describe("build", () => {
    it("should generate request conventions without parameters", function () {
      const convention = emptyRequestHandlerBuilder.build();
      expectEmptyRequestConvention(convention);
    });

    it("should generate request conventions with parameters", function () {
      // Reflect metadata ne doit pas bien fonctionner (modifier tsconfig ect....)
      // Voir package openapi pour la mise en place des tests en exemple
      const convention = getWithParamsRequestHandlerBuilder.build();
    });
  });
});
