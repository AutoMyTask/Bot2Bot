import {PathItem} from "swagger-jsdoc";
import {SwaggerOperation} from "./swagger.operation";

export class SwaggerPathItem {
    public readonly pathItem: PathItem = {}

    private swaggerOperation?: SwaggerOperation

    addOperation(method: string, swaggerOperation: SwaggerOperation) {
        this.pathItem[method] = swaggerOperation.operation
        this.swaggerOperation = swaggerOperation
        return this
    }

    getOperation(): SwaggerOperation | undefined {
        return this.swaggerOperation
    }
}
