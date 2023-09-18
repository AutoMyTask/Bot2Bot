import {ResponsesObject} from "openapi3-ts/oas31";
import {MetadataProduce} from "./metadata/metadataProduce";
import {ReferenceObject, ResponseObject} from "openapi3-ts/src/model/openapi31";

export const createResponsesObject = (metadataProduces: MetadataProduce[]): ResponsesObject => {
    let responseObject: Record<string, ResponseObject | ReferenceObject | any> = {}

    for (const {type, statutCode} of metadataProduces) {
        responseObject[statutCode] = {
            $ref: `#/components/responses/${type.name}`
        }
    }

    return responseObject
}
