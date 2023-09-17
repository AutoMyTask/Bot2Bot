import {SchemaObject} from "openapi3-ts/oas31";
import {ReferenceObject} from "openapi3-ts/src/model/openapi31";
import {OpenApiPropDecorator} from "./decorators/openapi.decorator";

type Constructor = new (...args: any[]) => {};

export const createSchema = (schema: Constructor): ReferenceObject | SchemaObject => {
    if (typeof schema === 'function' && schema) {

        const { properties, required } = new OpenApiPropDecorator(schema)

        return {
            description: "",
            type: 'object',
            properties,
            required
        }
    }
    return {}
}
