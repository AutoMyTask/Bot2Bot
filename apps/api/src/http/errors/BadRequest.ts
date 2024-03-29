import { OpenapiProp } from "openapi";

class ObjectValidationError {
  @OpenapiProp({ type: "object" }, { required: false })
  target?: object;

  @OpenapiProp({ type: "string" }, { required: false })
  property!: string;

  @OpenapiProp({ type: "object" }, { required: false })
  value?: object;

  @OpenapiProp(
    { type: "object", option: { additionalProperties: true } },
    { required: false },
  )
  constraints?: {
    [type: string]: any;
  };

  @OpenapiProp(
    {
      type: "array",
      option: {
        type: [
          {
            type: "object",
            option: { type: ObjectValidationError },
          },
        ],
      },
    },
    { required: false },
  )
  children?: ObjectValidationError[];

  @OpenapiProp(
    { type: "object", option: { additionalProperties: true } },
    { required: false },
  )
  contexts?: { [type: string]: any };
}

enum LocationEnum {
  Body = "body",
  Cookie = "cookies",
  Headers = "headers",
  Params = "params",
  Query = "query",
}

class ParamValidationError {
  @OpenapiProp({ type: "string" })
  type!: string;

  @OpenapiProp({
    type: "object",
    option: { type: { type: LocationEnum, name: "LocationEnum" } },
  })
  location!: LocationEnum;

  @OpenapiProp({ type: "string" })
  path!: string;

  @OpenapiProp({ type: "any" })
  value: any;

  @OpenapiProp({ type: "any" })
  msg: any;
}

export class BadRequest {
  @OpenapiProp({ type: "string" }, { required: false })
  message?: string;

  @OpenapiProp([
    {
      type: "array",
      option: {
        type: [
          {
            type: "object",
            option: { type: ObjectValidationError },
          },
        ],
      },
    },
    { type: "array", option: { type: [{ type: "string" }] } },
    {
      type: "array",
      option: {
        type: [
          {
            type: "object",
            option: { type: ParamValidationError },
          },
        ],
      },
    },
  ])
  errors!: ObjectValidationError[] | string[] | ParamValidationError[];
}
