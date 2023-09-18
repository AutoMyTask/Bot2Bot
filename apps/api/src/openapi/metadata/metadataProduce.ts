import {createSchema} from "../create.schema";
import {ReferenceObject, SchemaObject} from "openapi3-ts/oas31";
import {OpenApiPropDecorator} from "../decorators/openapi.decorator";

type New = new (...args: any) => {};

export type Schema = { type: New , schema: ReferenceObject | SchemaObject, statutCode: number }

export class MetadataProduce {
    schema: Schema
    schemas: Schema[] = []

    constructor( public readonly type: New ,public readonly statutCode: number = 200) {
        const openApiArray = new OpenApiPropDecorator(type)

        this.schema = { type, schema: createSchema(type), statutCode }

        for (let type of openApiArray.propertiesArray) {
            this.schemas.push({ type, schema: createSchema(type), statutCode })
        }
    }
}
