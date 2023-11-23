import { SchemaObject, ReferenceObject } from "openapi3-ts/dist/oas31";
import {
  ItemArrayObjectType,
  DefaultType,
  EnumType,
} from "../decorators/openapi.prop";
import { TypesCore } from "api-core-types";

export class PropertyObjectDefault {
  public property: SchemaObject;

  constructor(type: TypesCore.New | EnumType) {
    this.property = {
      type: "object",
      items: { $ref: `#/components/schemas/${type.name}` },
    };
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
    private readonly itemTypes: ItemArrayObjectType[],
  ) {
    this.property = { type };

    if (itemTypes.length > 1) {
      this.generateUnionItems();
    } else {
      this.generateItem();
    }
  }

  private generateItem() {
    const itemType = this.itemTypes[0];
    this.property.items = this.propertyFromItemType(itemType);
  }

  private generateUnionItems() {
    const items: SchemaObject = { oneOf: [] };

    for (let itemType of this.itemTypes) {
      items.oneOf?.push(this.propertyFromItemType(itemType));
    }

    this.property.items = items;
  }

  private propertyFromItemType(
    itemType: ItemArrayObjectType,
  ): ReferenceObject | SchemaObject {
    if (
      typeof itemType !== "string" &&
      (typeof itemType === "function" || typeof itemType === "object") // IsEnumType
    ) {
      return { $ref: `#/components/schemas/${itemType.name}` };
    }

    if (itemType === "any") {
      return {};
    }

    return { type: itemType };
  }
}
