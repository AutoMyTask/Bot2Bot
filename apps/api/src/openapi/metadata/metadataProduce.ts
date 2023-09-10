import {createSchema} from "../create.schema";
import {ReferenceObject, SchemaObject} from "openapi3-ts/oas31";

type New = new () => {};

export class MetadataProduce {
    schema: ReferenceObject | SchemaObject = {}
    constructor( public readonly type: New ,public readonly statutCode: number = 200) {
        this.schema = createSchema(new type())
    }
}
