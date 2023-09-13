import {ReferenceObject, RequestBodyObject} from "openapi3-ts/oas31";

type Constructor = new (...args: any[]) => {};

export const createRequestBody = (schema: Constructor): RequestBodyObject | ReferenceObject => {
    return {
        description: '',
        required: undefined,
        content: {
            'application/json': {
                schema: {
                    $ref: `#/components/schemas/${schema.name}`
                }
            }
        },
    }
}
