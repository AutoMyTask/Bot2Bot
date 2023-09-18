import {SchemaObject} from "openapi3-ts/dist/oas31";
import {ReferenceObject} from "openapi3-ts/src/model/openapi31";

type Properties = { [propertyName: string]: SchemaObject | ReferenceObject }

type Constructor = new (...args: any[]) => {};

export class OpenApiPropDecorator {
    public properties: Properties = Reflect.getMetadata('properties', this.target) || {}
    public required: string[] = Reflect.getMetadata('properties.required', this.target) || []
    public propertiesArray: Constructor[] = Reflect.getMetadata('properties.array', this.target) ?? []

    constructor(
        protected readonly target: Constructor
    ) {
    }

    addProp(propertyName: string, schemaObject: SchemaObject | ReferenceObject) {
        this.properties = {...this.properties, [propertyName]: schemaObject}
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
