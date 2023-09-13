import {createSchema} from "../create.schema";
import {ReferenceObject, SchemaObject} from "openapi3-ts/oas31";

type New = new (...args: any) => {};

export type Schema = { type: New , schema: ReferenceObject | SchemaObject, statutCode: number }

export class MetadataProduce {
    schemas: Schema[] = []

    constructor( public readonly type: New ,public readonly statutCode: number = 200) {
        const propertiesArray: New[] = Reflect.getMetadata('properties.array', type) ?? []

        this.schemas.push({ type, schema: createSchema(type), statutCode })

        for (let type of propertiesArray) {
            this.schemas.push({ type, schema: createSchema(type), statutCode })
        }
    }
}
