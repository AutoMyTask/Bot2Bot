import { beforeAll, describe, expect, it } from "vitest";
import { OpenapiProp } from "../../decorators/openapi.prop";
import { OpenApiPropDecorator } from "../../decorators/openapi.prop.decorator";
import { isReferenceObject } from "openapi3-ts/oas31";
import { ReferenceObject } from "openapi3-ts/oas30";

class ObjectInExample {}

class Example {
  @OpenapiProp({ type: "number" })
  numberProp!: number;

  @OpenapiProp({ type: "string" }, { required: false })
  notRequiredProp!: string;

  @OpenapiProp({
    type: "object",
    option: { type: ObjectInExample },
  })
  objectProp!: ObjectInExample;

  @OpenapiProp({ type: "object", option: { type: "any" } }) // A revoir
  anyProp!: any;
}

// Vérifier any type (toujours un propertyDefaultType ! )
// Vérifier que les isArrayProp ect... Fonctionne correctement. C'est important
// Générer une exception si j'utilise un mauvais format de données...
// AditionnalProperty a ajouter au niveau global.

describe("openapi.prop", () => {
  let openApiProp: OpenApiPropDecorator;

  beforeAll(() => {
    new Example();
    openApiProp = new OpenApiPropDecorator(Example);
  });

  it("should correctly a defaultProp' with the 'number' type in OpenAPI property metadata ", function () {
    const schemaObject = openApiProp.metadata.properties["numberProp"];
    expect(schemaObject.type).to.eq("number");
  });

  it("should correctly mark prop as a required property in OpenAPI metadata", function () {
    expect(openApiProp.metadata.required).to.contain("numberProp");
  });

  it("should mark a prop as a not required property in OpenAPI metadata", function () {
    expect(openApiProp.metadata.required).to.not.contain("notRequiredProp");
  });

  it("should mark a propObject as a schema in OpenAPI metadata", function () {
    console.log(openApiProp.metadata.schemas);
    expect(openApiProp.metadata.schemas).to.contain(ObjectInExample);
  });

  it("should mark a schemaObject.items propObject as a ReferenceObject in OpenAPI metadata", function () {
    const schemaObject = openApiProp.metadata.properties["objectProp"];
    console.log(openApiProp.metadata);
    expect(schemaObject.type).to.eq("object");
    expect(isReferenceObject(schemaObject.items)).to.eq(true);
    expect((schemaObject.items as ReferenceObject)?.["$ref"]).to.eq(
      `#/components/schemas/${ObjectInExample.name}`,
    );
  });

  it("should ", function () {});
});
