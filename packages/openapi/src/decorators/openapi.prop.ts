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
  | ObjectType;

export type DefaultType = PrimitiveType | NullType;
export type EnumType = { type: Enum; name: string };

export type ItemArrayType = TypesCore.New | EnumType | PrimitiveType;

type DefaultPropObject = {
  type: ObjectType;
  option: { type: TypesCore.New | EnumType };
};
type DefaultProp = { type: DefaultType };

type ArrayProp = {
  type: ArrayType;
  option: { type: ItemArrayType | ItemArrayType[] };
};

function isDefaultPropObject(value: any): value is DefaultPropObject {
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

export function OpenapiProp(
  types:
    | DefaultPropObject
    | DefaultProp
    | ArrayProp
    | (DefaultPropObject | DefaultProp | ArrayProp)[],
  options: OpenapiPropOption = { required: true },
) {
  return (target: Object, propName: string) => {
    const openApiProp = new OpenApiPropDecorator(
      target.constructor as TypesCore.New,
    );

    let props: (DefaultPropObject | DefaultProp | ArrayProp)[] = [];

    if (!Array.isArray(types)) {
      props.push(types);
    } else {
      props = types;
    }

    const propertyDefaults = props.map((prop) => {
      if (!isDefaultPropObject(prop) && prop.type === "object") {
        throw new Error(
          "InvalidDefaultObjectTypeError: Invalid default property type definition for object. Type must conform to the expected structure: { type: 'object', option: { type: TypesCore.New | EnumType } }",
        );
      }

      if (isDefaultPropObject(prop)) {
        openApiProp.addSchema(prop.option.type);
        return new PropertyObjectDefault(prop.option.type);
      }
      if (isDefaultProp(prop)) {
        return new PropertyDefault(prop.type);
      }

      let itemTypes: ItemArrayType[] = [];

      if (!Array.isArray(prop.option.type)) {
        itemTypes.push(prop.option.type);
      } else {
        itemTypes = prop.option.type;
      }

      for (const itemType of itemTypes) {
        if (typeof itemType === "function" || typeof itemType === "object") {
          openApiProp.addSchema(itemType);
        }
      }

      return new ArrayObjectProperty(prop.type, itemTypes);
    });

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
