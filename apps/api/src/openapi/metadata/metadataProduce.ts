import {createSchema} from "../create.schema";
import {ReferenceObject, SchemaObject} from "openapi3-ts/oas31";
import {OpenapiPropArrayDecorator} from "../decorators/openapi.prop.array";

type New = new (...args: any) => {};

export type Schema = { type: New , schema: ReferenceObject | SchemaObject, statutCode: number }

export class MetadataProduce {
    schemas: Schema[] = []

    constructor( public readonly type: New ,public readonly statutCode: number = 200) {
        const openApiArray = new OpenapiPropArrayDecorator(type)

        this.schemas.push({ type, schema: createSchema(type), statutCode })

        for (let type of openApiArray.propertiesArray) {
            this.schemas.push({ type, schema: createSchema(type), statutCode })
        }
    }
}
