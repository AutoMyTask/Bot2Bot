import {SchemaObject} from "openapi3-ts/dist/oas31";
import {ReferenceObject} from "openapi3-ts/src/model/openapi31";
import 'reflect-metadata'
import {TypesCore} from "core-types";
import {EnumType} from "./openapi.prop";

type Properties = Record<string, SchemaObject>

export type Enum = Record<string, string | number>


interface OpenApiPropMetadata {
    properties: Properties;
    required: string[];
    schemas: (TypesCore.New | EnumType)[]
}


// Fusionner enum et schema dans un seul et même objet

export class OpenApiPropDecorator {
    public metadata: OpenApiPropMetadata;

    constructor(
        protected readonly target: TypesCore.New
    ) {
        this.metadata = Reflect.getMetadata('properties', this.target) || {
            properties: {},
            required: [],
            schemas: []
        }
    }

    addProp(propertyName: string, schemaObject: SchemaObject | ReferenceObject) {
        this.metadata.properties[propertyName] = {
            ...this.metadata.properties[propertyName],
            ...schemaObject
        }
    }

    addRequired(propName: string) {
        this.metadata.required.push(propName)
    }

    addSchema(type: TypesCore.New | EnumType) {
        this.metadata.schemas.push(type)
    }

    update() {
        Reflect.defineMetadata('properties', this.metadata, this.target)
    }
}
