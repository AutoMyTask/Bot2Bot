import {SchemaObject} from "openapi3-ts/oas31";
import {ReferenceObject} from "openapi3-ts/src/model/openapi31";
import {Enum, OpenApiPropDecorator} from "./decorators/openapi.decorator";
import {TypesCore} from "core-types";

export const createSchema = (schema: TypesCore.New | { name: string; type: Enum; }): ReferenceObject | SchemaObject => {
    if (typeof schema === 'object'){
        const obj = schema as { name: string; type: Enum; }
        const entries = Object.entries(obj.type)
        const secondHalf = entries.slice(entries.length / 2)
        return {
            type: 'object',
            properties: {
                [obj.name]: {
                    type: 'number',
                    enum: secondHalf.map(([_, val]) => val ),
                    description: secondHalf.map((entry) => entry.join(':')).join('\n')
                }
            }
        }
    }
    if (typeof schema === 'function' && schema) {

        const { metadata } = new OpenApiPropDecorator(schema)
        const { properties, required } = metadata

        return {
            description: "",
            type: 'object',
            properties,
            required
        }
    }
    return {}
}
