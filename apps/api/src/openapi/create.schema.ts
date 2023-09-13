import {SchemaObject} from "openapi3-ts/oas31";
import {ReferenceObject} from "openapi3-ts/src/model/openapi31";

type Constructor = new (...args: any[]) => {};

export const createSchema = (schema: Constructor): ReferenceObject | SchemaObject => {
    if (typeof schema === 'function' && schema) {
        const properties = Reflect.getMetadata('properties', schema) || {}
        const required: string[] = Reflect.getMetadata('properties.required', schema) || [];

        return {
            description: "",
            type: 'object',
            properties,
            required
        }
    }
    return {}
}
