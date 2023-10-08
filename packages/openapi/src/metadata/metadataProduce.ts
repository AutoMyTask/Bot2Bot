import {createSchema} from "../create.schema";
import {ReferenceObject, SchemaObject} from "openapi3-ts/oas31";
import {Enum, OpenApiPropDecorator} from "../decorators/openapi.decorator";
import {TypesCore} from "core-types";
export type Schema = { type: TypesCore.New | { name: string, type: Enum } , schema: ReferenceObject | SchemaObject, statutCode: number }

export class MetadataProduce {
    schema: Schema
    schemas: Schema[] = []

    constructor( public readonly type: TypesCore.New ,public readonly statutCode: number = 200) {
        const openApiPropDecorator = new OpenApiPropDecorator(type)

        this.schema = { type, schema: createSchema(type), statutCode }

        for (const type of openApiPropDecorator.metadata.schemas) {
            this.schemas.push({ type, schema: createSchema(type), statutCode })
        }
        for (const type of openApiPropDecorator.metadata.enums){
            this.schemas.push({ type, schema: createSchema(type), statutCode })
        }
    }
}
