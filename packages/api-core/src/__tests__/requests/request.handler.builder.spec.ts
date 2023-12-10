import { describe, expect, it } from "vitest";
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
      // Suppprimer requiered, et doit être définit à true dans le package openapi
      // Changer le test et dire que c'est true par défaut (openapi package)
      // Voir pour query également
      const convention = getWithParamsRequestHandlerBuilder.build();
      const hasQueryOrPath =
        (param: "query" | "path") =>
        (
          name: string,
          type: "int" | "float" | "number" | "string",
          required?: boolean,
        ): boolean => {
          return convention.params[param].some(
            (param) =>
              param.name === name &&
              param.required === required &&
              param.type === type,
          );
        };

      const hasPath = hasQueryOrPath("path");
      const hasQuery = hasQueryOrPath("query");

      expect(convention.handlers.length).eq(2);

      expect(hasPath("pathNumber", "number")).eq(true);
      expect(hasPath("pathString", "string")).eq(true);
      expect(hasPath("pathInt", "int")).eq(true);
      expect(hasPath("pathFloat", "float")).eq(true);
      expect(hasQuery("queryNumber", "number")).eq(true);
      expect(hasQuery("queryString", "string")).eq(true);
      expect(hasQuery("queryInt", "int")).eq(true);
      expect(hasQuery("queryFloat", "float")).eq(true);
    });
  });
});
