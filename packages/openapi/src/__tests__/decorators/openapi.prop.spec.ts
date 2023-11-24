import { beforeAll, describe, expect, it } from "vitest";
import { isEnumType, OpenapiProp } from "../../decorators/openapi.prop";
import { OpenApiPropDecorator } from "../../decorators/openapi.prop.decorator";
import { ReferenceObject, SchemaObject } from "openapi3-ts/oas30";
import { ExampleRessource } from "../fixtures/ExampleRessource";
import { EnumExample } from "../fixtures/enum.example";
import { ObjectInExample } from "../fixtures/object.in.example";

// Vérifier que les isArrayProp ect... Fonctionne correctement. C'est important
// AditionnalProperty a ajouter au niveau global. Créer un decorateur spécifique
// Refratorer le code de test et couvrir un maximum de cas

describe("OpenAPI Property Decorator", () => {
  let openApiProp: OpenApiPropDecorator;

  beforeAll(() => {
    new ExampleRessource();
    openApiProp = new OpenApiPropDecorator(ExampleRessource);
  });

  function getPropertySchema(propertyName: string) {
    return openApiProp.metadata.properties![propertyName];
  }

  it("should correctly define 'numberProp' as a 'number' type in OpenAPI metadata", function () {
    const schemaObject = getPropertySchema("numberProp");
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
    const schemaObject = getPropertySchema("objectClassProp");
    expect(schemaObject.type).to.eq("object");
    expect((schemaObject.items as ReferenceObject)?.["$ref"]).to.eq(
      `#/components/schemas/${ObjectInExample.name}`,
    );
  });

  it("should define 'objectEnumProp' as a valid schema in OpenAPI metadata for an enum type", function () {
    expect(
      openApiProp.metadata.schemas.some(
        (schema) =>
          isEnumType(schema) &&
          schema.type === EnumExample &&
          schema.name === "EnumExample",
      ),
    ).to.eq(true);
  });

  it("should define 'objectEnumProp' items as a ReferenceObject in OpenAPI metadata for object type indicator when using a EnumType", function () {
    const schemaObject = getPropertySchema("objectEnumProp");
    expect(schemaObject.type).to.eq("object");
    expect((schemaObject.items as ReferenceObject)?.["$ref"]).to.eq(
      `#/components/schemas/EnumExample`,
    );
  });

  it("should define 'anyProp' as an empty object in OpenAPI metadata for 'any' type indicator", function () {
    const schemaObject = getPropertySchema("anyProp");
    expect(schemaObject).to.be.an("object").that.is.empty;
  });

  it("should define 'arrayClassProp' as an 'array' type and set its items as a ReferenceObject ", function () {
    const schemaObject = getPropertySchema("arrayClassProp");
    expect(schemaObject.type).to.eq("array");
    expect((schemaObject.items as ReferenceObject)?.$ref).to.eq(
      `#/components/schemas/${ObjectInExample.name}`,
    );
  });

  it("should define 'arrayEnumTypeProp' as an 'array' type and set its items as a ReferenceObject ", function () {
    const schemaObject = getPropertySchema("arrayEnumTypeProp");
    expect(schemaObject.type).to.eq("array");
    expect((schemaObject.items as ReferenceObject)?.$ref).to.eq(
      `#/components/schemas/EnumExample`,
    );
  });

  it("should define 'arrayDefaultTypeProp' as an 'array' type and set its items as a SchemaObject ", function () {
    const schemaObject = getPropertySchema("arrayDefaultTypeProp");
    expect(schemaObject.type).to.eq("array");
    expect((schemaObject.items as SchemaObject).type).to.eq("integer");
  });

  it("should define 'unionProp' as a union type containing number and object types in OpenAPI metadata ", function () {
    const schemaObject = getPropertySchema("unionProp");

    expect(schemaObject.type).is.an("undefined");
    expect(schemaObject.oneOf).is.an("array");
    expect(schemaObject.oneOf).is.not.empty;
    expect(schemaObject.oneOf).is.length(2);
    expect((schemaObject.oneOf![0] as SchemaObject).type).to.eq("string");
    expect(
      ((schemaObject.oneOf![1] as SchemaObject).items as ReferenceObject).$ref,
    ).to.eq(`#/components/schemas/${ObjectInExample.name}`);
  });

  it("should define 'arrayOfUnionProp' as an 'array' type with various subtypes in OpenAPI metadata ", function () {
    const schemaObject = getPropertySchema("arrayOfUnionProp");
    expect(schemaObject.type).to.eq("array");
    expect((schemaObject.items as SchemaObject).oneOf).is.not.empty;
    expect((schemaObject.items as SchemaObject).oneOf).is.an("array");
    expect((schemaObject.items as SchemaObject).oneOf).is.length(4);

    expect(
      ((schemaObject.items as SchemaObject).oneOf![0] as SchemaObject).type,
    ).is.eq("number");
    expect(
      ((schemaObject.items as SchemaObject).oneOf![1] as ReferenceObject).$ref,
    ).is.eq(`#/components/schemas/${ObjectInExample.name}`);
    expect(
      ((schemaObject.items as SchemaObject).oneOf![2] as SchemaObject).type,
    ).is.eq("string");
    expect(
      ((schemaObject.items as SchemaObject).oneOf![3] as SchemaObject).type,
    ).is.eq("array");
    expect(
      (
        ((schemaObject.items as SchemaObject).oneOf![3] as SchemaObject)
          .items as ReferenceObject
      ).$ref,
    ).is.eq(`#/components/schemas/${ObjectInExample.name}`);
  });
});
