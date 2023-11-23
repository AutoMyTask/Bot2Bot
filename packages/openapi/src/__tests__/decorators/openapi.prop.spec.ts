import { beforeAll, describe, expect, it } from "vitest";
import { isEnumType, OpenapiProp } from "../../decorators/openapi.prop";
import { OpenApiPropDecorator } from "../../decorators/openapi.prop.decorator";
import { ReferenceObject, SchemaObject } from "openapi3-ts/oas30";

enum EnumExample {
  One,
  Two,
  Three,
}

class ObjectInExample {}

class Example {
  @OpenapiProp({ type: "number" })
  numberProp!: number;

  @OpenapiProp({ type: "string" }, { required: false })
  notRequiredProp!: string;

  @OpenapiProp({
    type: "object",
    option: { type: ObjectInExample }, // Essayer de voir si c'est pas une class mais un enum générer une erreur
  })
  objectClassProp!: ObjectInExample;

  @OpenapiProp({
    type: "object",
    option: { type: { type: EnumExample, name: "EnumExample" } },
  })
  objectEnumProp: EnumExample;

  @OpenapiProp({ type: "any" })
  anyProp!: any;

  @OpenapiProp({ type: "array", option: { type: ObjectInExample } })
  arrayClassProp!: ObjectInExample[];

  @OpenapiProp({
    type: "array",
    option: { type: { type: EnumExample, name: "EnumExample" } },
  })
  arrayEnumTypeProp: EnumExample[];

  @OpenapiProp({ type: "array", option: { type: "integer" } })
  arrayDefaultTypeProp!: number[];

  @OpenapiProp([
    { type: "number" },
    { type: "object", option: { type: ObjectInExample } },
  ])
  unionProp!: ObjectInExample | number;
}

// Vérifier que les isArrayProp ect... Fonctionne correctement. C'est important
// AditionnalProperty a ajouter au niveau global. Créer un decorateur spécifique
// Couvrir les arrayOfUnionProp

describe("OpenAPI Property Decorator", () => {
  let openApiProp: OpenApiPropDecorator;

  beforeAll(() => {
    new Example();
    openApiProp = new OpenApiPropDecorator(Example);
  });

  it("should correctly define 'numberProp' as a 'number' type in OpenAPI metadata", function () {
    const schemaObject = openApiProp.metadata.properties["numberProp"];
    expect(schemaObject.type).to.eq("number");
  });

  it("should mark 'numberProp' as a required property in OpenAPI metadata", function () {
    expect(openApiProp.metadata.required).to.contain("numberProp");
  });

  it("should mark 'notRequiredProp' as an optional property in OpenAPI metadata", function () {
    expect(openApiProp.metadata.required).to.not.contain("notRequiredProp");
  });

  it("should define 'objectClassProp' as a schema in OpenAPI metadata for object type indicator when using a class", function () {
    expect(openApiProp.metadata.schemas).to.contain(ObjectInExample);
  });

  it("should define 'objectClassProp' items as a ReferenceObject in OpenAPI metadata for object type indicator when using a class", function () {
    const schemaObject = openApiProp.metadata.properties["objectClassProp"];
    expect(schemaObject.type).to.eq("object");
    expect((schemaObject.items as ReferenceObject)?.["$ref"]).to.eq(
      `#/components/schemas/${ObjectInExample.name}`,
    );
  });

  it("should define 'EnumExample' as a valid schema in OpenAPI metadata for an enum type", function () {
    expect(
      openApiProp.metadata.schemas.some(
        (schema) =>
          isEnumType(schema) &&
          schema.type === EnumExample &&
          schema.name === "EnumExample",
      ),
    ).to.eq(true);
  });

  it("should define 'objectClassProp' items as a ReferenceObject in OpenAPI metadata for object type indicator when using a EnumType", function () {
    const schemaObject = openApiProp.metadata.properties["objectEnumProp"];
    expect(schemaObject.type).to.eq("object");
    expect((schemaObject.items as ReferenceObject)?.["$ref"]).to.eq(
      `#/components/schemas/EnumExample`,
    );
  });

  it("should define 'anyProp' as an empty object in OpenAPI metadata for 'any' type indicator", function () {
    const schemaObject = openApiProp.metadata.properties["anyProp"];
    expect(schemaObject).to.be.an("object").that.is.empty;
  });

  it("should define 'arrayClassProp' as an 'array' type and set its items as a ReferenceObject ", function () {
    const schemaObject = openApiProp.metadata.properties["arrayClassProp"];
    expect(schemaObject.type).to.eq("array");
    expect((schemaObject.items as ReferenceObject)?.$ref).to.eq(
      `#/components/schemas/${ObjectInExample.name}`,
    );
  });

  it("should define 'arrayEnumTypeProp' as an 'array' type and set its items as a ReferenceObject ", function () {
    const schemaObject = openApiProp.metadata.properties["arrayEnumTypeProp"];
    expect(schemaObject.type).to.eq("array");
    expect((schemaObject.items as ReferenceObject)?.$ref).to.eq(
      `#/components/schemas/EnumExample`,
    );
  });

  it("should define 'arrayDefaultTypeProp' as an 'array' type and set its items as a SchemaObject ", function () {
    const schemaObject =
      openApiProp.metadata.properties["arrayDefaultTypeProp"];
    expect(schemaObject.type).to.eq("array");
    expect((schemaObject.items as SchemaObject).type).to.eq("integer");
  });

  it("should define 'unionProp' as a union type containing number and object types in OpenAPI metadata ", function () {
    const schemaObject = openApiProp.metadata.properties["unionProp"];
    expect(schemaObject.oneOf).is.an("array");
    expect(schemaObject.oneOf).is.not.empty;
    expect(schemaObject.oneOf).is.length(2);
    expect((schemaObject.oneOf![0] as SchemaObject).type).to.eq("number");
    expect(
      ((schemaObject.oneOf![1] as SchemaObject).items as ReferenceObject).$ref,
    ).to.eq(`#/components/schemas/${ObjectInExample.name}`);
  });
});
