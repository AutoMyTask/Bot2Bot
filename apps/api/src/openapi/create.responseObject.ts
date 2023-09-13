import {MetadataProduce, Schema} from "./metadata/metadataProduce";
import {ResponseObject} from "openapi3-ts/oas31";
import {ReferenceObject} from "openapi3-ts/oas30";

export const createResponseObject = (metadataProduce: Schema): ResponseObject | ReferenceObject => {
    return {
        description: '',
        content: {
            'application/json': {
                schema: {
                    $ref: `#/components/schemas/${metadataProduce.type.name}`
                }
            }
        }
    }
}
