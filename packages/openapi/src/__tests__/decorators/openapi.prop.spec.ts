import { describe, expect, it } from "vitest";
import { OpenapiProp } from "../../decorators/openapi.prop";
import { OpenApiPropDecorator } from "../../decorators/openapi.prop.decorator";

class ObjectInExample {}

class Example {
  @OpenapiProp({ type: "number" })
  numberProp!: number;

  @OpenapiProp({ type: "string" }, { required: false })
  notRequiredProp!: string;

  @OpenapiProp({ type: "object", option: { type: ObjectInExample } })
  objectProp!: ObjectInExample;
}

// Vérifier required
// Vérifier que les isArrayProp ect... Fonctionne correctement. C'est important
// Générer une exception si j'utilise un mauvais format de données...

describe("openapi.prop", () => {
  it("should correctly annotate 'numberProp' with the 'number' type in OpenAPI property metadata ", function () {
    new Example();
    const openApiProp = new OpenApiPropDecorator(Example);
    const schemaObject = openApiProp.metadata.properties["numberProp"];
    expect(schemaObject.type).to.eq("number");
  });

  it("should correctly mark 'numberProp' as a required property in OpenAPI metadata", function () {
    new Example();
    const openApiProp = new OpenApiPropDecorator(Example);
    expect(openApiProp.metadata.required).to.contain("numberProp");
  });

  it("should not mark 'notRequiredProp' as a required property in OpenAPI metadata", function () {
    new Example();
    const openApiProp = new OpenApiPropDecorator(Example);
    expect(openApiProp.metadata.required).to.not.contain("notRequiredProp");
  });
});
