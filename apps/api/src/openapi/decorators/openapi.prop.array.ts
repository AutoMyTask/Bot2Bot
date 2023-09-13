import {SchemaObject} from "openapi3-ts/dist/oas31";
import 'reflect-metadata'

type Constructor = new (...args: any[]) => {};

export function OpenapiPropArray(
    type: Constructor,
    options?: { minMax?: { maxLength?: number, minLength?: number }, required?: boolean }
) {
    return (target: Object, propName: string) => {
        const existingProperties = Reflect.getMetadata('properties', target.constructor) ?? {};
        const required: string[] = Reflect.getMetadata('properties.required', target.constructor) ?? [];
        const propertiesArray = Reflect.getMetadata('properties.array', type) ?? []

        propertiesArray.push(type)

        if (options?.required) {
            required.push(propName);
        }


        const properties: SchemaObject = {
            ...existingProperties,
            ...{
                [propName]: {
                    type: 'array',
                    items: {
                        $ref: `#/components/schemas/${type.name}`
                    }
                }
            }
        };

        Reflect.defineMetadata('properties', properties, target.constructor);
        Reflect.defineMetadata('properties.required', required, target.constructor);
        Reflect.defineMetadata('properties.array', propertiesArray, target.constructor);
    };
}
