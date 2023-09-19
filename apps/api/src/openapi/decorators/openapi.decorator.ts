import {SchemaObject} from "openapi3-ts/dist/oas31";
import {ReferenceObject} from "openapi3-ts/src/model/openapi31";
import 'reflect-metadata'

type Properties = Record<string, SchemaObject | ReferenceObject>
type Constructor = new (...args: any[]) => {};

export class OpenApiPropDecorator {
    public properties: Properties
    public required: string[]
    public propertiesArray: Constructor[]

    constructor(
        protected readonly target: Constructor
    ) {
        this.properties = Reflect.getMetadata('properties', this.target) || {}
        this.required =  Reflect.getMetadata('properties.required', this.target) || []
        this.propertiesArray = Reflect.getMetadata('properties.array', this.target) ?? []
    }

    addProp(propertyName: string, schemaObject: SchemaObject | ReferenceObject) {
        this.properties[propertyName] =  schemaObject
        Reflect.defineMetadata('properties', this.properties, this.target)
    }

    addRequired(required: string) {
        this.required.push(required)
        Reflect.defineMetadata('properties.required', this.required, this.target)
    }

    addPropertyToArray(type: Constructor) {
        this.propertiesArray.push(type)
        Reflect.defineMetadata('properties.array', this.propertiesArray, this.target)
    }
}
