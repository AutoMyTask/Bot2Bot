import {SchemaObject} from "openapi3-ts/dist/oas31";
import {ReferenceObject} from "openapi3-ts/src/model/openapi31";
import 'reflect-metadata'

type Properties = Record<string, SchemaObject | ReferenceObject>
export type Constructor = new (...args: any[]) => {};

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
    public schemas: Constructor[]
    public enums: { name: string, type: Enum }[]

    constructor(
        protected readonly target: Constructor
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

    addDefaultProperty(propName: string, property: {
        type: DefaultType | DefaultType[],
        maxLength?: number,
        minLength?: number,
        additionalProperties?: SchemaObject | ReferenceObject | boolean
    }) {
        this.addProp(propName, property)
        return property
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
    addSchema(type: Constructor) {
        this.schemas.push(type)
        Reflect.defineMetadata('properties.schemas', this.schemas, this.target)
    }

    addEnum(type: { name: string, type: Enum }) {
        this.enums.push(type)
        Reflect.defineMetadata('properties.enums', this.enums, this.target)
    }
}
