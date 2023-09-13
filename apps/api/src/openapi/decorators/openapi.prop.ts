import {SchemaObject} from "openapi3-ts/dist/oas31";
import 'reflect-metadata'

type OpenapiPropType =
    | 'integer'
    | 'number'
    | 'string'
    | 'boolean'
    | 'object'
    | 'null'

export function OpenapiProp(
    type: OpenapiPropType,
    options?: {
        minMax?: { maxLength?: number ,minLength?: number },
        required?: boolean,
        additionalProperties?: boolean
    }
) {
    return (target: Object, propName: string) => {
        const existingProperties = Reflect.getMetadata('properties', target.constructor) || {};
        const required: string[] = Reflect.getMetadata('properties.required', target.constructor) || [];

        if (options?.required) {
            required.push(propName);
        }

        const properties: SchemaObject = {
            ...existingProperties,
            ...{
                [propName]: {
                    type,
                    maxLength: options?.minMax?.maxLength,
                    minLength: options?.minMax?.minLength,
                    additionalProperties: options?.additionalProperties
                }
            }
        };

        Reflect.defineMetadata('properties', properties, target.constructor);
        Reflect.defineMetadata('properties.required', required, target.constructor);
    };
}
