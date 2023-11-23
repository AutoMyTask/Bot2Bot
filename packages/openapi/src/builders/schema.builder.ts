import { ReferenceObject, SchemaObject } from "openapi3-ts/oas31";
import { TypesCore } from "api-core-types";
import { EnumType, isEnumType } from "../decorators/openapi.prop";
import { OpenApiPropDecorator } from "../decorators/openapi.prop.decorator";
import { OpenapiObjectDescriptorDecorator } from "../decorators/openapi.object.descriptor.decorator";

export type Schema = {
  type: TypesCore.New | EnumType;
  schema: ReferenceObject | SchemaObject;
};

export class SchemaBuilder {
  private schemas: Map<string, Schema> = new Map<string, Schema>();

  get getSchemas() {
    return this.schemas;
  }

  addSchema(type: TypesCore.New | EnumType) {
    if (this.schemas.has(type.name)) {
      return;
    }

    this.schemas.set(type.name, { type, schema: this.createSchema(type) });

    if (!isEnumType(type)) {
      const {
        metadata: { schemas },
      } = new OpenApiPropDecorator(type);
      for (const schema of schemas) {
        this.addSchema(schema); // Récusivité
      }
    }
  }

  private createSchema(
    schema: TypesCore.New | EnumType,
  ): SchemaObject | ReferenceObject {
    if ("type" in schema && "name" in schema && typeof schema === "object") {
      let type: "number" | "string";
      let values: any[];

      if (Object.values(schema.type).some((val) => typeof val === "number")) {
        const entries = Object.entries(schema.type);
        values = entries.slice(entries.length / 2);
        type = "number";
      } else {
        values = Object.entries(schema.type);
        type = "string";
      }

      return {
        type: "object",
        properties: {
          [schema.name]: {
            type,
            enum: values.map(([_, val]) => val),
            description: values.map((val) => val.join(":")).join("\n"),
          },
        },
      };
    }

    if (typeof schema === "function") {
      // Identifie les classes (is new)
      const {
        metadata: { properties, required },
      } = new OpenApiPropDecorator(schema);
      const {
        metadata: { option },
      } = new OpenapiObjectDescriptorDecorator(schema);

      return {
        type: "object",
        properties,
        required,
        ...option,
      };
    }

    return {};
  }
}
