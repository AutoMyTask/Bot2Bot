import {ReferenceObject, RequestBodyObject} from "openapi3-ts/oas31";
import {TypesCore} from "api-common";

export const createRequestBody = (schema: TypesCore.New): RequestBodyObject | ReferenceObject => {
    return {
        description: '',
        required: undefined,
        content: {
            'application/json': {
                schema: {
                    $ref: `#/components/schemas/${schema.name}`
                }
            }
        }
    } as RequestBodyObject | ReferenceObject
}
