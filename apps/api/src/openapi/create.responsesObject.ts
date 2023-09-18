import {ResponsesObject} from "openapi3-ts/oas31";
import {MetadataProduce} from "./metadata/metadataProduce";

export const createResponsesObject = (metadataProduces: MetadataProduce[]): ResponsesObject => {
    let responseObject: ResponsesObject = {}
    for (const { type, statutCode } of metadataProduces) {
        responseObject = {
            ...responseObject,
            [statutCode]: {
                $ref: `#/components/responses/${type.name}`
            }
        }
    }
    return responseObject
}
