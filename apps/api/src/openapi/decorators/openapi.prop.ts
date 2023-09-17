import {SchemaObject} from "openapi3-ts/dist/oas31";
import 'reflect-metadata'
import {OpenApiPropDecorator} from "./openapi.decorator";

export type OpenapiPropType =
    | 'integer'
    | 'number'
    | 'string'
    | 'boolean'
    | 'object'
    | 'null'

type Constructor = new (...args: any[]) => {};

export function OpenapiProp(
    type: OpenapiPropType,
    options?: {
        minMax?: { maxLength?: number, minLength?: number },
        required?: boolean,
        additionalProperties?: boolean
    }
) {
    return (target: Object, propName: string) => {
        const openApiProp = new OpenApiPropDecorator(target.constructor as Constructor)

        if (options?.required) {
            openApiProp.addRequired(propName)
        }

        const property = {
            type,
            maxLength: options?.minMax?.maxLength,
            minLength: options?.minMax?.minLength,
            additionalProperties: options?.additionalProperties
        } as SchemaObject


        openApiProp.addProp(propName, property)
    };
}
