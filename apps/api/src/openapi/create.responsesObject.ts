import {ResponsesObject} from "openapi3-ts/oas31";
import {Schema} from "./metadata/metadataProduce";

export const createResponsesObject = (metadataProduces: Schema[]): ResponsesObject => {
    let responseObject: ResponsesObject = {}
    for (const { type, statutCode } of metadataProduces) {
        responseObject = {
            [statutCode]: {
                $ref: `#/components/responses/${type.name}`
            }
        }
    }
    return responseObject
}
