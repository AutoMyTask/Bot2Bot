import {SchemaObject} from "openapi3-ts/oas31";
import {ReferenceObject} from "openapi3-ts/src/model/openapi31";

export const createSchema = (schema: object | string | boolean | number | null | Array<any>): ReferenceObject | SchemaObject => {
    if (typeof schema === 'object' && schema && !Array.isArray(schema)) {
        const properties = Object.entries(schema).reduce((properties, [prop, value]) => {
            const newProp: SchemaObject | ReferenceObject = {
                [prop]: {
                    type: typeof value
                }
            }
            properties = {...properties, ...newProp}
            return properties
        }, {})

        return {
            description: "",
            type: 'object',
            properties
        }
    }
    return {}
}
