import {ReferenceObject, RequestBodyObject} from "openapi3-ts/oas31";

export const createRequestBody = (schema: object): RequestBodyObject | ReferenceObject => {
    return {
        description: '',
        required: undefined,
        content: {
            'application/json': {
                schema: {
                    $ref: `#/components/schemas/${schema.constructor.name}`
                }
            }
        },
    }
}
