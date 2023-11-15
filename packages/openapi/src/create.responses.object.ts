import {ResponsesObject} from "openapi3-ts/oas31";
import {MetadataProduce} from "./metadata/metadata.produce";
import {ReferenceObject, ResponseObject} from "openapi3-ts/src/model/openapi31";

export const createResponsesObject = (metadataProduces: MetadataProduce[]): ResponsesObject => {
    let responsesObject: Record<string, ResponseObject | ReferenceObject | any> = {}

    for (const {statutCode, referenceResponse} of metadataProduces) {
        responsesObject[statutCode] = referenceResponse
    }

    return responsesObject
}
