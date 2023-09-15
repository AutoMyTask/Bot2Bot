import {HTTPMethod} from "../app.builder";
import {ParameterLocation, ParameterObject, PathItemObject} from "openapi3-ts/oas31";
import {MetadataTag} from "./metadata/metadataTag";
import {Schema} from "./metadata/metadataProduce";
import {createResponsesObject} from "./create.responsesObject";
import {entries} from "lodash";

type Constructor = new (...args: any[]) => {};

type ParamsConventions = {
    path: { name: string, type: string | number | 'int' | 'float', required?: boolean }[]
}

const createFormat = (type: Constructor | string | number | 'int' | 'float') => {
    if (typeof type === 'string'){
        return type
    }
    if (typeof type === 'function'){
        return type.name.toLowerCase()
    }

}

export const createPathItem = (
    params: ParamsConventions,
    method: HTTPMethod,
    metadataTags: MetadataTag[],
    metadataProduces: Schema[],
    body?: Constructor,): PathItemObject => {
    const responses = createResponsesObject(metadataProduces)
    const tags = metadataTags.map(metadataTag => metadataTag.name)

    let parameters: ParameterObject[] = []
    entries(params).forEach(([key, params]) => {
        for (let {name, type, required} of params) {
            parameters.push({
                name,
                in: key as ParameterLocation,
                required: required ?? true,
                schema: {
                    format: createFormat(type)
                }
            })
        }
    })

    const requestBody = body ? {
        $ref: `#/components/requestBodies/${body.name}`
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
