import {RequestBodyObject} from "openapi3-ts/oas31";
import {TypesCore} from "api-core-types";

export const createRequestBody = (schema: TypesCore.New): RequestBodyObject  => {
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
    }
}
