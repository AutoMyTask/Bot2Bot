import { OpenapiProp } from "../../decorators/openapi.prop";
import { EnumExample } from "./enum.example";
import { ObjectInExample } from "./object.in.example";
import { OpenapiObjectDescriptor } from "../../decorators/openapi.object.descriptor.decorator";

@OpenapiObjectDescriptor({ description: "Description de ExampleRessource" })
export class ExampleRessource {
  @OpenapiProp({ type: "number" })
  numberProp!: number;

  @OpenapiProp({ type: "string" }, { required: false })
  notRequiredProp!: string;

  @OpenapiProp({
    type: "object",
    option: { type: ObjectInExample },
  })
  objectClassProp!: ObjectInExample;

  @OpenapiProp({
    type: "object",
    option: { type: { type: EnumExample, name: "EnumExample" } },
  })
  objectEnumProp!: EnumExample;

  @OpenapiProp({ type: "any" })
  anyProp!: any;

  @OpenapiProp({
    type: "array",
    option: { type: [{ type: "object", option: { type: ObjectInExample } }] },
  })
  arrayClassProp!: ObjectInExample[];

  @OpenapiProp({
    type: "array",
    option: {
      type: [
        {
          type: "object",
          option: { type: { type: EnumExample, name: "EnumExample" } },
        },
      ],
    },
  })
  arrayEnumTypeProp!: EnumExample[];

  @OpenapiProp({ type: "array", option: { type: [{ type: "integer" }] } })
  arrayDefaultTypeProp!: number[];

  @OpenapiProp([
    { type: "string" },
    { type: "object", option: { type: ObjectInExample } },
  ])
  unionProp!: ObjectInExample | string;

  @OpenapiProp({
    type: "array",
    option: {
      type: [
        {
          type: "number",
        },
        {
          type: "object",
          option: { type: ObjectInExample },
        },
        {
          type: "string",
        },
        {
          type: "array",
          option: {
            type: [{ type: "object", option: { type: ObjectInExample } }],
          },
        },
      ],
    },
  })
  arrayOfUnionProp!: (number | ObjectInExample | string | ObjectInExample[])[];
}
