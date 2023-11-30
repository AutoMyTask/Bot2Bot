import { beforeAll, describe, expect, it } from "vitest";
import { AppBuilder } from "api-core";
import { AppCore, RouteCore } from "api-core-types";
import { configureOpenApi } from "../configure.openapi";
import { endpoints } from "./fixtures/endpoints";
import {
  isReferenceObject,
  OpenApiBuilder,
  OperationObject,
  ParameterObject,
  ResponsesObject,
} from "openapi3-ts/oas31";
import { openApi } from "../openapi";
import { ReferenceObject, SchemaObject } from "openapi3-ts/oas30";
import HTTPMethod = RouteCore.HTTPMethod;
import { ExampleRessource } from "./fixtures/ExampleRessource";

describe("openapi", () => {
  let app: AppCore.IApp;
  let openApiBuilder: OpenApiBuilder;
  let paramIntParameterPath: ParameterObject;
  let queryStringRequiredParameterPath: ParameterObject;

  beforeAll(() => {
    // Create an error in app tests, if @params('parm'), the 'param' is not present in the path
    // Check the format of paths (/:param) to ({param})
    // Creer des erreur dans app core, pour vérifier que les params sont dans le bon format

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

  function findPath(path: string, method: HTTPMethod) {
    return openApiBuilder.rootDoc.paths[path][method];
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

    it("The  query parameter is not required in the path", function () {
      const queryStringNotRequiredParameterPath = findPathParameter(
        "get",
        "/path/{paramInt}/{paramNumber}",
        "queryStringNotRequired",
      );

      expect(queryStringNotRequiredParameterPath.required).eq(false);
    });

    it("The query parameter is required by default", function () {
      expect(queryStringRequiredParameterPath.required).eq(true);
    });
  });

  describe("Responses", () => {
    let pathGet: OperationObject;

    beforeAll(() => {
      pathGet = findPath("/path/{paramInt}/{paramNumber}", "get");
    });

    it("should define a default status code of 200 when including MetadataProduce to specify a response", function () {
      const response200 = pathGet.responses["200"] as ReferenceObject;
      expect(response200).is.not.an("undefined");
    });

    it("should define a status code of 400 when including MetadataProduce to specify a response", function () {
      const response200 = pathGet.responses["400"] as ReferenceObject;
      expect(response200).is.not.an("undefined");
    });

    it("should reference the ExampleResource component in the responses path", function () {
      const response200 = pathGet.responses["200"] as ReferenceObject;
      expect(response200.$ref).eq(
        `#/components/responses/${ExampleRessource.name}`,
      );

      // Voir pour la description.... responseComponent.description
      // Peut être que cela serrai intéréssant justement de fournir une autre réponse que
      // le schema, si j'ai des schema imbriqué
      const responseComponent = openApiBuilder.rootDoc.components.responses[
        ExampleRessource.name
      ] as ResponsesObject;
      expect(responseComponent.content["application/json"].schema.$ref).eq(
        `#/components/schemas/${ExampleRessource.name}`,
      );

      const schema = openApiBuilder.rootDoc.components.schemas[
        ExampleRessource.name
      ] as SchemaObject;
      expect(schema.type).eq("object");
      expect(schema.properties).an("object");
    });

    describe("Tag", () => {
      it("should be associated a tag with the specified path ", function () {
        const path =
          openApiBuilder.rootDoc.paths["/path/{paramInt}/{paramNumber}"]["get"];
        expect(path.tags.some((tag) => tag === "Tag")).eq(true);
      });

      it("should have the correct description for the specified tag", function () {
        expect(
          openApiBuilder.rootDoc.tags.some(
            (tag) =>
              tag.name === "Tag" && tag.description === "Une description",
          ),
        ).eq(true);
      });
    });
  });
});
