import { beforeAll, describe, expect, it } from "vitest";
import { AppBuilder } from "api-core";
import { AppCore, RouteCore } from "api-core-types";
import { configureOpenApi } from "../configure.openapi";
import { endpoints } from "./fixtures/endpoints";
import {
  isReferenceObject,
  OpenApiBuilder,
  ParameterObject,
} from "openapi3-ts/oas31";
import { openApi } from "../openapi";
import { SchemaObject } from "openapi3-ts/oas30";
import HTTPMethod = RouteCore.HTTPMethod;

describe("openapi", () => {
  let app: AppCore.IApp;
  let openApiBuilder: OpenApiBuilder;
  let paramIntParameterPath: ParameterObject;
  let queryStringRequiredParameterPath: ParameterObject;

  beforeAll(() => {
    // Create an error in app tests, if @params('parm'), the 'param' is not present in the path
    // Check the format of paths (/:param) to ({param})

    const builder = AppBuilder.createAppBuilder();
    builder.configure(configureOpenApi((builder) => {}));
    app = builder.build();
    app.addEndpoints(endpoints).use(openApi);
    openApiBuilder = app.services.get(OpenApiBuilder);
    paramIntParameterPath = findPathParameter(
      "get",
      "/path/{paramInt}/{paramNumber}",
      "paramInt",
    );

    queryStringRequiredParameterPath = findPathParameter(
      "get",
      "/path/{paramInt}/{paramNumber}",
      "queryStringRequired",
    );
  });

  function findPathParameter(
    method: HTTPMethod,
    path: string,
    parameterName: string,
  ) {
    return openApiBuilder.rootDoc.paths[`${path}`][method].parameters.find(
      (param) => !isReferenceObject(param) && param.name === parameterName,
    ) as ParameterObject;
  }

  describe("Path Param", () => {
    it("The params path should have 'path' value in 'in' property", function () {
      expect(paramIntParameterPath.in).eq("path");
    });

    it("The params path should be required by default", function () {
      expect(paramIntParameterPath.required).eq(true);
    });

    it("The 'paramInt' path parameter should be of type 'numberType' and follow the 'int' format in the path", function () {
      expect(paramIntParameterPath.name).eq("paramInt");

      expect(!isReferenceObject(paramIntParameterPath.schema)).eq(true);

      const schemaParameterPath = paramIntParameterPath.schema as SchemaObject;

      expect(schemaParameterPath.type).eq("number");
      expect(schemaParameterPath.format).eq("int");
    });

    it("The 'paramNumber' path parameter should be of type 'number' in the path", function () {
      const paramNumberParameterPath = findPathParameter(
        "get",
        "/path/{paramInt}/{paramNumber}",
        "paramNumber",
      );

      expect(paramNumberParameterPath.name).eq("paramNumber");

      expect(!isReferenceObject(paramNumberParameterPath.schema)).eq(true);

      const schemaParameterPath =
        paramNumberParameterPath.schema as SchemaObject;
      expect(schemaParameterPath.type).eq("number");
      expect(schemaParameterPath.format).is.an("undefined");
    });
  });

  describe("Query Param", () => {
    it("The params query should have 'query' value in 'in' property", function () {
      expect(queryStringRequiredParameterPath.in).eq("query");
    });

    it("The query parameters should be of type 'number' or 'string'", function () {
      const schemaQueryParameterString =
        queryStringRequiredParameterPath.schema as SchemaObject;
      expect(schemaQueryParameterString.type).eq("string");

      const schemaQueryParameterNumber = findPathParameter(
        "get",
        "/path/{paramInt}/{paramNumber}",
        "queryParamNumber",
      ).schema as SchemaObject;
      expect(schemaQueryParameterNumber.type).eq("number");
    });

    it("The 'queryStringNotRequired' query parameter is not required in the path", function () {
      const queryStringNotRequiredParameterPath = findPathParameter(
        "get",
        "/path/{paramInt}/{paramNumber}",
        "queryStringNotRequired",
      );

      expect(queryStringNotRequiredParameterPath.required).eq(false);
    });

    it("The 'queryStringRequired' query parameter is required by default", function () {
      const queryStringRequiredParameterPath = findPathParameter(
        "get",
        "/path/{paramInt}/{paramNumber}",
        "queryStringRequired",
      );

      expect(queryStringRequiredParameterPath.required).eq(true);
    });
  });
});
