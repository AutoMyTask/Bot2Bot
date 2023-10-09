import 'reflect-metadata'
import {OpenApiPropDecorator, Enum} from "./openapi.pro.decorator";
import {TypesCore} from "core-types";
import {ArrayObjectProperty, PropertyDefault} from "../builders/property.builder";


export type NullType = 'null'

type ArrayType = 'array'

type ObjectType = 'object'

export type PrimitiveType = 'integer' | 'number' | 'string' | 'boolean' | 'any' | ObjectType

export type DefaultType = PrimitiveType | NullType
export type EnumType = { type: Enum, name: string }

export type ItemArrayObjectType = TypesCore.New | EnumType | PrimitiveType

type DefaultPropObject = { type: ObjectType, option: { additionalProperties: boolean } }
type DefaultProp = { type: DefaultType }

type ArrayObjectProp = {
    type: ArrayType | ObjectType,
    option: { type: ItemArrayObjectType | ItemArrayObjectType[] }
}


function isDefaultPropObject(value: any): value is DefaultPropObject {
    return value && value.type === 'object' && typeof value.option === 'object' && 'additionalProperties' in value.option;
}

function isDefaultProp(value: any): value is DefaultProp {
    return value
        && typeof value.type === 'string' && ['integer', 'number', 'string', 'boolean', 'null', 'object', 'any'].includes(value.type)
        && value.option === undefined;
}

type OpenapiPropOption = { required: boolean }


// Avoir une separation claire des object et array (pas besoin des mêmes types)
// Pour l'objet par exemple, il faut absolument un type object de base suivie des unions ou un 'additionalProperties'
// Pour array on peut avoir un tableau de integer, string... on s'en fou à part null
export function OpenapiProp(
    types: DefaultPropObject | DefaultProp | ArrayObjectProp | (DefaultPropObject | DefaultProp | ArrayObjectProp)[],
    options: OpenapiPropOption = {required: true}
) {

    return (target: Object, propName: string) => {
        const openApiProp = new OpenApiPropDecorator(target.constructor as TypesCore.New)

        let props: (DefaultPropObject | DefaultProp | ArrayObjectProp)[] = []

        if (!Array.isArray(types)) {
            props.push(types)
        } else {
            props = types
        }

        const propertyDefaults = props.map(prop => {
            if (isDefaultPropObject(prop)) {
                return new PropertyDefault(prop.type, prop.option)
            }
            if (isDefaultProp(prop)) {
                return new PropertyDefault(prop.type)
            }

            let itemTypes: ItemArrayObjectType[] = []

            if (!Array.isArray(prop.option.type)) {
                itemTypes.push(prop.option.type)
            } else {
                itemTypes = prop.option.type
            }

            for (const itemType of itemTypes) {
                if (typeof itemType === 'function' || typeof itemType === 'object') {
                    openApiProp.addSchema(itemType)
                }
            }

            return new ArrayObjectProperty(prop.type, itemTypes)
        })


        const unionProp = new PropertyDefault()

        for (const propertyDefault of propertyDefaults) {
            if (propertyDefaults.length > 1) {
                unionProp.addUnion(propertyDefault.property)
                openApiProp.addProp(propName, unionProp.property)
            } else {
                openApiProp.addProp(propName, propertyDefault.property)
            }
        }


        if (options.required) {
            openApiProp.addRequired(propName)
        }

        openApiProp.update()
    };
}
