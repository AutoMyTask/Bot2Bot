import {TypesCore} from "core-types";
import {ReferenceObject, ResponseObject} from "openapi3-ts/oas31";

export class MetadataProduce {
    public readonly responseObject: ResponseObject
    public readonly referenceResponse: ReferenceObject

    constructor( public readonly type: TypesCore.New ,public readonly statutCode: number = 200) {
        this.responseObject = {
            description: '',
            content: {
                'application/json': {
                    schema: { $ref: `#/components/schemas/${type.name}` }
                }
            }
        }
        this.referenceResponse = { $ref: `#/components/responses/${type.name}` }
    }
}
