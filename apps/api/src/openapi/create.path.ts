import {HTTPMethod, ParamsConventions} from "../app.builder";
import {ParameterLocation, ParameterObject, PathItemObject} from "openapi3-ts/oas31";

export const createPathItem = (
    params: ParamsConventions,
    method: HTTPMethod,
    body?: object): PathItemObject => {
    let parameters: ParameterObject[] = []
    Object.entries(params).forEach(([key, values]) => {
        for (let value of values) {
            parameters.push({
                name: value,
                in: key as ParameterLocation
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
            requestBody
        }
    }
}
