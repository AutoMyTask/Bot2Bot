import {
  ParameterLocation,
  ParameterObject,
  PathItemObject,
} from "openapi3-ts/oas31";
import { MetadataTag } from "./metadata/metadataTag";
import { MetadataProduce } from "./metadata/metadata.produce";
import { createResponsesObject } from "./create.responses.object";
import { entries } from "lodash";
import { SecurityRequirementObject } from "openapi3-ts/src/model/openapi31";
import { RequestCore, RouteCore } from "api-core-types";

const createType = (type: "string" | "number" | "int" | "float") => {
  if (type === "number" || type === "int" || type === "float") {
    return "number";
  }
  if (type === "string") {
    return type;
  }
};

export const createPathItem = (
  params: RequestCore.Params.ParamsConventions,
  method: RouteCore.HTTPMethod,
  metadataTags: MetadataTag[],
  metadataProduces: MetadataProduce[],
  schemes?: string[],
): PathItemObject => {
  const responses = createResponsesObject(metadataProduces);
  const tags = metadataTags.map((metadataTag) => metadataTag.name);
  let parameters: ParameterObject[] = [];
  let security: SecurityRequirementObject[] = [];

  if (schemes) {
    security = schemes.reduce((security, scheme) => {
      security.push({ [scheme]: [] });
      return security;
    }, [] as SecurityRequirementObject[]);
  }

  entries(params).forEach(([key, params]) => {
    if (Array.isArray(params)) {
      for (let { name, type, required } of params) {
        if (typeof type !== "function") {
          parameters.push({
            name,
            in: key as ParameterLocation,
            required: required ?? true,
            schema: {
              format: type === "number" || type === "string" ? undefined : type,
              type: createType(type),
            },
          });
        }
      }
    }
  });

  const requestBody = params.body
    ? {
        $ref: `#/components/requestBodies/${params.body.name}`,
      }
    : undefined;

  return {
    [method]: {
      description: "une description",
      parameters,
      requestBody,
      tags,
      responses,
      security,
    },
  };
};
