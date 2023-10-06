import 'reflect-metadata'
import {DefaultType, OpenApiPropDecorator, Enum} from "./openapi.decorator";
import {TypesCore} from "core-types";


type OpenapiPropOption = {
    required?: boolean,
    minMax?: { maxLength?: number, minLength?: number },
    additionalProperties?: boolean
}

type OpenapiOptionType = {
    type?: 'object' | 'array',   // Si le type principal et le type optionnel sont 'object' générer une exeption. Idem pour array
                                 // Si le type principal est un CONSTRUCTOR il faut absolument indiquer si c'est un array ou un object type. Idem pour enum
    enum?: string
}


type OpenapiType = {
    type: DefaultType | TypesCore.New | Enum,
    option?: OpenapiOptionType
}

export function OpenapiProp(
    types: OpenapiType[],
    options: OpenapiPropOption = {required: true}
) {

    return (target: Object, propName: string) => {
        const openApiProp = new OpenApiPropDecorator(target.constructor as TypesCore.New)

        // Alors union type !!!
        if (types.length > 1) {
            for (const type of types) {
                if (typeof type.type === 'function' || typeof type.type === 'object') {
                    generateUnionEnumAndConstructorSpec(openApiProp, propName, type.type, type.option)
                } else {
                    openApiProp.addUnionProp(propName, {
                        type: type.type as DefaultType,
                        maxLength: options.minMax?.maxLength,
                        minLength: options.minMax?.minLength,
                        additionalProperties: options.additionalProperties
                    })
                }
            }
        } else  { // Sinon pas union type
            for (const type of types) {
                if (typeof type.type === 'function' || typeof type.type === 'object') {
                    generateEnumAndConstructorSpec(openApiProp, propName, type.type, type.option)
                } else {
                    openApiProp.addDefaultProperty(propName, {
                        type: type.type as DefaultType,
                        maxLength: options.minMax?.maxLength,
                        minLength: options.minMax?.minLength,
                        additionalProperties: options.additionalProperties
                    })
                }
            }
        }


        if (options.required) {
            openApiProp.addRequired(propName)
        }
    };
}


const generateUnionEnumAndConstructorSpec = (
    openApiProp: OpenApiPropDecorator,
    propName: string,
    type: TypesCore.New | Enum,
    options?: OpenapiOptionType
) => {
    if (typeof type === 'function' && options && options.type) {
        openApiProp.addUnionRefProperty(propName, type.name, options)
        openApiProp.addSchema(type)
    }
    if (options && options.enum && typeof type !== 'function') {
        openApiProp.addUnionRefProperty(propName, options.enum, options)
        openApiProp.addEnum({name: options.enum, type})
    }
}


const generateEnumAndConstructorSpec = (
    openApiProp: OpenApiPropDecorator,
    propName: string,
    type: TypesCore.New | Enum,
    options?: OpenapiOptionType
) => {
    if (typeof type === 'function' && options && options.type) {
        openApiProp.addRefProperty(propName, type.name, options)
        openApiProp.addSchema(type)
    }
    if (options && options.enum && typeof type !== 'function') {
        openApiProp.addRefProperty(propName, options.enum, options)
        openApiProp.addEnum({name: options.enum, type})
    }
}
