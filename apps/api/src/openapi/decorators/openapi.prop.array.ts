import {SchemaObject} from "openapi3-ts/dist/oas31";
import 'reflect-metadata'
import {OpenApiPropDecorator} from "./openapi.decorator";
import {ReferenceObject} from "openapi3-ts/oas31";

type Constructor = new (...args: any[]) => {};

// Je pense que je vais utiliser qu'openprop à l'avenir. Ou que OpenPropDecorator à voir
// Va falloir absolument faire un effort de conception
// Peut être même créer un schema à partir du decorator (cela semble une bonne idée)
export class OpenapiPropArrayDecorator extends OpenApiPropDecorator {
    public propertiesArray: Constructor[] = Reflect.getMetadata('properties.array', this.target) ?? []
    constructor(protected readonly target: Constructor) {
        super(target);
    }

    addPropertyToArray(type: Constructor){
        this.propertiesArray.push(type)
        Reflect.defineMetadata('properties.array', this.propertiesArray, this.target)
    }
}

export function OpenapiPropArray(
    type: Constructor,
    options?: { minMax?: { maxLength?: number, minLength?: number }, required?: boolean }
) {
    return (target: Object, propName: string) => {
        const openApiPropArray = new OpenapiPropArrayDecorator(target.constructor as Constructor)

        openApiPropArray.addPropertyToArray(type)

        if (options?.required) {
            openApiPropArray.addRequired(propName);
        }

        const property: SchemaObject = {
            type: 'array',
            items: {
                $ref: `#/components/schemas/${type.name}`
            }
        }

        openApiPropArray.addProp(propName, property)
    };
}
