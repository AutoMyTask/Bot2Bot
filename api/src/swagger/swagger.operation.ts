import {Operation} from "swagger-jsdoc";
import {SwaggerResponse} from "./swagger.response";
import {SwaggerRequest} from "./swagger.request";

export class SwaggerOperation {
    public readonly operation: Operation = {}

    constructor(tag: string | undefined) {
        if (tag) {
            this.operation = {
                tags: [tag]
            }
        }
    }

    addResponse({ response }: SwaggerResponse): SwaggerOperation {
        this.operation.responses = {...response}
        return this
    }

    addRequestBody({ requestBody }: SwaggerRequest ): SwaggerOperation {
        this.operation.requestBody = {...requestBody}
        return this
    }
}
