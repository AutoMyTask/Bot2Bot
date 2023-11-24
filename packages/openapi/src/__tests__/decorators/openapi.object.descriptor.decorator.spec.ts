import { beforeAll, describe, expect, it } from "vitest";
import { ExampleRessource } from "../fixtures/ExampleRessource";
import { OpenapiObjectDescriptorDecorator } from "../../decorators/openapi.object.descriptor.decorator";
import { EmptyRessource } from "../fixtures/EmptyRessource";

describe("OpenAPI Object Descriptor Decorator", () => {
  let openApiObjectDescriptor: OpenapiObjectDescriptorDecorator;

  beforeAll(() => {
    new ExampleRessource();
    openApiObjectDescriptor = new OpenapiObjectDescriptorDecorator(
      ExampleRessource,
    );
  });

  it("should have default metadata properties", () => {
    const { option } = new OpenapiObjectDescriptorDecorator(EmptyRessource)
      .metadata;
    expect(option).to.an("object").that.is.empty;
  });

  it("should set the correct description in metadata option ", function () {
    const expectedDescription = "Description de ExampleRessource";
    const actualDescription =
      openApiObjectDescriptor.metadata.option.description;
    expect(actualDescription).to.eq(expectedDescription);
  });
});
