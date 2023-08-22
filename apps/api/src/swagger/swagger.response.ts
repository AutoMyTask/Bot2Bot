import {Schema} from "swagger-jsdoc";

interface Response{
    [statusCode: number]: {
        content: {
            [contentType: string]: {
                schema: Schema
            }
        }
    }
}

export class SwaggerResponse {
    public readonly response: Response

    constructor(statutCode: number, contentType: string, schema : Schema) {
        this.response = {
            [statutCode]: {
                content: {
                    [contentType]: {
                        schema
                    }
                }
            }
        }
    }
}
