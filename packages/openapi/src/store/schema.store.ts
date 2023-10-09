import {ReferenceObject, SchemaObject} from "openapi3-ts/oas31";
import {TypesCore} from "core-types";
import {EnumType} from "../decorators/openapi.prop";
import {OpenApiPropDecorator} from "../decorators/openapi.pro.decorator";
import {MetadataProduce} from "../metadata/metadata.produce";

export type Schema = { type: TypesCore.New | EnumType, schema: ReferenceObject | SchemaObject }

export class SchemaStore {
    private schemas: Map<string, Schema> = new Map<string, Schema>();

    get getSchemas(){
        return this.schemas
    }

    addSchema(type: TypesCore.New | EnumType) {
        if (this.schemas.has(type.name)){
            return
        }

        this.schemas.set(type.name, {type, schema: this.createSchema(type)})

        if (typeof type === 'function'){
            const { metadata: { schemas } } = new OpenApiPropDecorator(type)
            for (const schema of schemas) {
                this.addSchema(schema)
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
