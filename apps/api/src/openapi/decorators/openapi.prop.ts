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
    | Constructor

type Constructor = new (...args: any[]) => {};

export function OpenapiProp(
    type: OpenapiPropType,
    options?: {
        type?: 'object' | 'array' // Si le type principal et le type optionnel sont 'object' générer une exeption
                                  // Si le type principal est une fonction il absolument indiqué si c'est un array ou un object type
        minMax?: { maxLength?: number, minLength?: number },
        required?: boolean,
        additionalProperties?: boolean
    }
) {
    return (target: Object, propName: string) => {
        const openApiProp = new OpenApiPropDecorator(target.constructor as Constructor)

        let property: SchemaObject

        if (typeof type === 'function' && options?.type === 'array') {
            property = {
                type: 'array',
                items: {
                    $ref: `#/components/schemas/${type.name}`
                }
            }
            openApiProp.addPropertyToArray(type)
        } else {
            property = {
                type,
                maxLength: options?.minMax?.maxLength,
                minLength: options?.minMax?.minLength,
                additionalProperties: options?.additionalProperties
            } as SchemaObject
        }

        if (options?.required) {
            openApiProp.addRequired(propName)
        }

        openApiProp.addProp(propName, property)
    };
}
