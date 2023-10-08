import {ParameterLocation, ParameterObject, PathItemObject} from "openapi3-ts/oas31";
import {MetadataTag} from "./metadata/metadataTag";
import {MetadataProduce} from "./metadata/metadataProduce";
import {createResponsesObject} from "./create.responsesObject";
import {entries} from "lodash";
import {SecurityRequirementObject} from "openapi3-ts/src/model/openapi31";
import {RequestCore, RouteCore, TypesCore} from "core-types";


// Pas à mettre ici, mais de core type. Cela doit être construit par mon core
type ParamsConventions = {
    path: RequestCore.Params.Param<RequestCore.Params.ParamPathType>[]
    query: RequestCore.Params.Param<RequestCore.Params.ParamQueryType>[]
}

// Remplacer par les types défini dans core-type
const createFormat = (type: TypesCore.New | 'string' | 'number' | 'int' | 'float') => {
    if (typeof type === 'string'){
        return type
    }
    if (typeof type === 'function'){
        return type.name.toLowerCase()
    }

}

export const createPathItem = (
    params: ParamsConventions,
    method: RouteCore.HTTPMethod,
    metadataTags: MetadataTag[],
    metadataProduces: MetadataProduce[],
    schemes?: string[],
    // Body devrait être dans param convention
    body?: TypesCore.New,): PathItemObject => {
    const responses = createResponsesObject(metadataProduces)
    const tags = metadataTags.map(metadataTag => metadataTag.name)
    let parameters: ParameterObject[] = []
    let security: SecurityRequirementObject[]  = []

    if (schemes){
        security = schemes.reduce((security, scheme) => {
            security.push({ [scheme]: [] })
            return security
        }, [] as SecurityRequirementObject[])
    }

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
            responses,
            security
        }
    }
}
