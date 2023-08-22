import {Operation, PathItem, Schema} from "swagger-jsdoc";
import 'reflect-metadata'
import * as TJS from 'typescript-json-schema'
import {resolve} from "path"
import {SwaggerOperation} from "./swagger/swagger.operation";





export class SwaggerSchema {
    public readonly schema: Schema

    constructor(
        public readonly fileName: string,
        public readonly typeName: string
    ) {
        const program = TJS.getProgramFromFiles(
            [resolve(this.fileName)],
        )
        this.schema = TJS.generateSchema(program, this.typeName) as Schema
    }
}
