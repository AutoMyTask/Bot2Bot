import {ReferenceObject, SchemaObject} from "openapi3-ts/oas31";
import {OpenApiPropDecorator} from "../decorators/openapi.pro.decorator";
import {TypesCore} from "core-types";
import {SchemaStore} from "../store/schema.store";
import {EnumType} from "../decorators/openapi.prop";
export type Schema = { type: TypesCore.New | EnumType , schema: ReferenceObject | SchemaObject, statutCode: number }

export class MetadataProduce {
    constructor( public readonly type: TypesCore.New ,public readonly statutCode: number = 200) {
        const schemaStore = new SchemaStore()
        schemaStore.addSchema(type)
    }
}
