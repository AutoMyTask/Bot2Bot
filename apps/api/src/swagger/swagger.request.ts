import {Schema} from "swagger-jsdoc";

interface RequestBody {
    required: boolean,
    content: {
        [contentType: string]: {
            schema: Schema
        }
    }
}

export class SwaggerRequest {
    public readonly requestBody: RequestBody

    constructor(contentType: string, schema: Schema) {
        this.requestBody = {
            required: true,
            content: {
                [contentType]: {
                    schema
                }
            }
        }
    }
}
