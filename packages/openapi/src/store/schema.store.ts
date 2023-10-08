import {ReferenceObject, SchemaObject} from "openapi3-ts/oas31";
import {TypesCore} from "core-types";
import {EnumType} from "../decorators/openapi.prop";
import {OpenApiPropDecorator} from "../decorators/openapi.pro.decorator";

export type Schema = { type: TypesCore.New | EnumType, schema: ReferenceObject | SchemaObject }

export class SchemaStore {
    private static schemas: Map<string, Schema> = new Map<string, Schema>();

    get schemas(){
        return SchemaStore.schemas
    }

    addSchema(type: TypesCore.New | EnumType) {
        if (SchemaStore.schemas.has(type.name)){
            return
        }

        SchemaStore.schemas.set(type.name, {type, schema: this.createSchema(type)})

        if (typeof type === 'function'){
            const { metadata: { schemas, enums } } = new OpenApiPropDecorator(type)
            for (const schema of schemas) {
                this.addSchema(schema)
            }

            for (const enum1 of enums) {
                this.addSchema(enum1)
            }

        }
    }

    private createSchema(schema: TypesCore.New | EnumType): SchemaObject | ReferenceObject {
        if ('type' in schema && 'name' in schema && typeof schema === 'object') {
            const obj = schema
            const entries = Object.entries(obj.type)
            const secondHalf = entries.slice(entries.length / 2)
            return {
                type: 'object',
                properties: {
                    [obj.name]: {
                        type: 'number',
                        enum: secondHalf.map(([_, val]) => val),
                        description: secondHalf.map((entry) => entry.join(':')).join('\n')
                    }
                }
            }
        }

        if (typeof schema === 'function') {
            const {metadata: { properties, required }} = new OpenApiPropDecorator(schema)

            return {
                description: "",
                type: 'object',
                properties,
                required
            }
        }

        return {}
    }
}
