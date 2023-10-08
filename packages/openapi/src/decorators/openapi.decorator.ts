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
    schemas: TypesCore.New[];
    enums: { name: string, type: Enum }[];
}


export class OpenApiPropDecorator {
    public metadata: OpenApiPropMetadata;

    constructor(
        protected readonly target: TypesCore.New
    ) {
        this.metadata = Reflect.getMetadata('properties', this.target) || {
            properties: {},
            required: [],
            schemas: [],
            enums: [],
        };
    }

    addProp(propertyName: string, schemaObject: SchemaObject | ReferenceObject) {
        this.metadata.properties[propertyName] = {
            ...this.metadata.properties[propertyName],
            ...schemaObject
        }

        Reflect.defineMetadata('properties', this.metadata, this.target)
    }

    addRequired(propName: string) {
        this.metadata.required.push(propName)
        Reflect.defineMetadata('properties', this.metadata, this.target)
    }

    addSchema(type: TypesCore.New) {
        this.metadata.schemas.push(type)
        Reflect.defineMetadata('properties', this.metadata, this.target)
    }

    addEnum(type: EnumType) {
        this.metadata.enums.push(type)
        Reflect.defineMetadata('properties', this.metadata, this.target)
    }
}
