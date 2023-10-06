import {SchemaObject} from "openapi3-ts/dist/oas31";
import {ReferenceObject} from "openapi3-ts/src/model/openapi31";
import 'reflect-metadata'
import {TypesCore} from "core-types";

type Properties = Record<string, SchemaObject>

export type Enum = Record<string, string | number>

export type DefaultType =
    | 'integer'
    | 'number'
    | 'string'
    | 'boolean'
    | 'object'
    | 'null'



export class OpenApiPropDecorator {
    public properties: Properties
    public required: string[]
    public schemas: TypesCore.New[]
    public enums: { name: string, type: Enum }[]

    constructor(
        protected readonly target: TypesCore.New
    ) {
        this.properties = Reflect.getMetadata('properties', this.target) || {}
        this.required = Reflect.getMetadata('properties.required', this.target) || []
        this.schemas = Reflect.getMetadata('properties.schemas', this.target) || []
        this.enums = Reflect.getMetadata('properties.enums', this.target) || []
    }

    addRefProperty(propName: string, type: string, options: { type?: 'object' | 'array' }) {
        const property: SchemaObject = {
            type: options.type,
            items: {
                $ref: `#/components/schemas/${type}`
            }
        }
        this.addProp(propName, property)
        return property
    }

    addUnionRefProperty(propName: string, type: string, options: { type?: 'object' | 'array' }) {
        const property: SchemaObject = {
            type: options.type,
            items: {
                $ref: `#/components/schemas/${type}`
            }
        }
        this.addUnionProp(propName, property)
        return property
    }

    addDefaultProperty(propName: string, property: SchemaObject | ReferenceObject) {
        this.addProp(propName, property)
        return property
    }

    addUnionProp(propertyName: string, schemaObject: SchemaObject | ReferenceObject){
        this.properties[propertyName] ??= {}
        this.properties[propertyName].oneOf ??=  []
        this.properties[propertyName].oneOf?.push(schemaObject)
        Reflect.defineMetadata('properties', this.properties, this.target)
    }

    addProp(propertyName: string, schemaObject: SchemaObject | ReferenceObject) {
        this.properties[propertyName] = {
            ...this.properties[propertyName],
            ...schemaObject
        }

        Reflect.defineMetadata('properties', this.properties, this.target)
    }

    addRequired(propName: string) {
        this.required.push(propName)
        Reflect.defineMetadata('properties.required', this.required, this.target)
    }

    // Peut être être beaucoup générique est l'appeller properties.schemas
    addSchema(type: TypesCore.New) {
        this.schemas.push(type)
        Reflect.defineMetadata('properties.schemas', this.schemas, this.target)
    }

    addEnum(type: { name: string, type: Enum }) {
        this.enums.push(type)
        Reflect.defineMetadata('properties.enums', this.enums, this.target)
    }
}
