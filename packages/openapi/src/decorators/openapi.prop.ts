import "reflect-metadata";
import { OpenApiPropDecorator, Enum } from "./openapi.prop.decorator";
import { TypesCore } from "api-core-types";
import {
  ArrayObjectProperty,
  PropertyDefault,
  PropertyObjectDefault,
} from "../builders/property.builder";

export type NullType = "null";

type ArrayType = "array";

type ObjectType = "object";

export type PrimitiveType =
  | "integer"
  | "number"
  | "string"
  | "boolean"
  | "any"
  | NullType;

export type AnonymousObject = {
  type: ObjectType;
  option?: { additionalProperties: boolean };
};

export type DefaultType = PrimitiveType;
export type EnumType = { type: Enum; name: string };

export type ItemArrayType = TypesCore.New | EnumType | DefaultType;

export type DefaultPropObject = {
  type: ObjectType;
  option: { type: TypesCore.New | EnumType };
};
type DefaultProp = { type: DefaultType };

type ArrayProp = {
  type: ArrayType;
  option: {
    type: (DefaultPropObject | DefaultProp | ArrayProp | AnonymousObject)[];
  };
};

export function isAnonymousObject(value: any): value is AnonymousObject {
  return (
    value &&
    value.type === "object" &&
    (value.option === undefined ||
      (typeof value.option === "object" &&
        "additionalProperties" in value.option))
  );
}

export function isDefaultPropObject(value: any): value is DefaultPropObject {
  return (
    value &&
    value.type === "object" &&
    typeof value.option === "object" &&
    (typeof value.option.type === "function" || isEnumType(value.option.type))
  );
}

function isDefaultProp(value: any): value is DefaultProp {
  return (
    value &&
    typeof value.type === "string" &&
    [
      "integer",
      "number",
      "string",
      "boolean",
      "null",
      "object",
      "any",
    ].includes(value.type) &&
    value.option === undefined
  );
}

export function isEnumType(value: any): value is EnumType {
  return (
    value &&
    typeof value === "object" &&
    "name" in value &&
    "type" in value &&
    typeof value.type === "object" &&
    Object.keys(value.type).every(
      (key) =>
        typeof value.type[key] === "string" ||
        typeof value.type[key] === "number",
    )
  );
}

type OpenapiPropOption = {
  required: boolean;
};

function createProperties(
  props: (DefaultPropObject | DefaultProp | ArrayProp | AnonymousObject)[],
  openApiProp: OpenApiPropDecorator,
): (PropertyObjectDefault | PropertyDefault | ArrayObjectProperty)[] {
  return props.map((prop) => {
    if (isDefaultPropObject(prop)) {
      openApiProp.addSchema(prop.option.type);
    }

    if (isDefaultPropObject(prop) || isAnonymousObject(prop)) {
      return new PropertyObjectDefault(prop);
    }
    if (isDefaultProp(prop)) {
      return new PropertyDefault(prop.type);
    }

    const propsArray = createProperties(prop.option.type, openApiProp);
    return new ArrayObjectProperty("array", propsArray);
  });
}

export function OpenapiProp(
  types:
    | DefaultPropObject
    | DefaultProp
    | ArrayProp
    | AnonymousObject
    | (DefaultPropObject | DefaultProp | ArrayProp | AnonymousObject)[],
  options: OpenapiPropOption = { required: true },
) {
  return (target: Object, propName: string) => {
    const openApiProp = new OpenApiPropDecorator(
      target.constructor as TypesCore.New,
    );

    let props: (
      | DefaultPropObject
      | DefaultProp
      | ArrayProp
      | AnonymousObject
    )[] = [];

    if (!Array.isArray(types)) {
      props.push(types);
    } else {
      props = types;
    }

    const propertyDefaults = createProperties(props, openApiProp);
    const unionProp = new PropertyDefault();

    for (const propertyDefault of propertyDefaults) {
      if (propertyDefaults.length > 1) {
        unionProp.addUnion(propertyDefault.property);
        openApiProp.addProp(propName, unionProp.property);
      } else {
        openApiProp.addProp(propName, propertyDefault.property);
      }
    }

    if (options.required) {
      openApiProp.addRequired(propName);
    }

    openApiProp.update();
  };
}
