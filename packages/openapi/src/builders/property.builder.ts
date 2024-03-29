import { SchemaObject, ReferenceObject } from "openapi3-ts/dist/oas31";
import {
  DefaultType,
  DefaultPropObject,
  isDefaultPropObject,
  isAnonymousObject,
  AnonymousObject,
} from "../decorators/openapi.prop";
import { isReferenceObject } from "openapi3-ts/oas30";

export class PropertyObjectDefault {
  public property: SchemaObject;

  constructor(prop: DefaultPropObject | AnonymousObject) {
    this.property = { type: "object" };
    if (isAnonymousObject(prop)) {
      // @ts-ignore
      this.property.additionalProperties = prop.option?.additionalProperties;
    }

    if (isDefaultPropObject(prop)) {
      this.property.items = {
        $ref: `#/components/schemas/${prop.option.type.name}`,
      };
    }
  }
}

export class PropertyDefault {
  public property: SchemaObject = {};

  constructor(type?: DefaultType) {
    if (type) {
      this.property = type === "any" ? {} : { type };
    }
  }

  addUnion(property: SchemaObject | ReferenceObject) {
    this.property.oneOf ??= [];
    this.property.oneOf.push(property);
  }
}

export class ArrayObjectProperty {
  public property: SchemaObject;

  constructor(
    private readonly type: "array" | "object",
    private readonly props: (
      | PropertyObjectDefault
      | PropertyDefault
      | ArrayObjectProperty
    )[],
  ) {
    this.property = { type };
    if (this.props.length > 1) {
      this.generateUnionItems();
    } else {
      this.generateItem();
    }
  }

  private generateItem() {
    const prop = this.props[0];
    const { items, type } = prop.property;

    if (items && type === "object" && isReferenceObject(items)) {
      this.property.items = items;
    } else {
      this.property.items = prop.property;
    }
  }

  private generateUnionItems() {
    const schemaObject: SchemaObject = { oneOf: [] };

    for (let prop of this.props) {
      const { items, type } = prop.property;

      if (items && type === "object" && isReferenceObject(items)) {
        schemaObject.oneOf?.push(items);
      } else {
        schemaObject.oneOf?.push(prop.property);
      }
    }

    this.property.items = schemaObject;
  }
}
