import {HTTPMethod, ParamsConventions} from "../app.builder";
import {ParameterLocation, ParameterObject, PathItemObject} from "openapi3-ts/oas31";
import {MetadataTag} from "./metadata/metadataTag";
import {MetadataProduce} from "./metadata/metadataProduce";
import {createResponsesObject} from "./create.responsesObject";

function inRequired(inPath: ParameterLocation): boolean{
    if (inPath === 'path'){
        return true
    }
    return false
}

export const createPathItem = (
    params: ParamsConventions,
    method: HTTPMethod,
    metadataTags: MetadataTag[],
    metadataProduces: MetadataProduce[],
    body?: object,): PathItemObject => {
    const responses = createResponsesObject(metadataProduces)
    const tags = metadataTags.map(metadataTag => metadataTag.name)

    let parameters: ParameterObject[] = []
    Object.entries(params).forEach(([key, params]) => {
        for (let {name, type} of params) {
            parameters.push({
                name,
                in: key as ParameterLocation,
                required: inRequired(key as ParameterLocation),
                schema: {
                    format: 'int32'
                }
            })
        }
    })

    const requestBody = body ? {
        $ref: `#/components/requestBodies/${body.constructor.name}`
    } : undefined

    return {
        [method]: {
            description: 'une description',
            parameters,
            requestBody,
            tags,
            responses
        }
    }
}
