import {injectable} from "inversify";
import {Components, OAS3Options, Paths, Schema} from "swagger-jsdoc";
import {SwaggerPathItem} from "./swagger.pathitem";

interface SwaggerOptions {
    title: string;
    version: string;
    description?: string;
}

@injectable()
export class Swagger {
    public swaggerSpec: OAS3Options = {apis: [__filename]}
    private components: Components = {}
    private paths: Map<string, SwaggerPathItem> = new Map()
    private schemas: Map<string, Schema> = new Map()

    constructor() {
    }

    addInfo(options: SwaggerOptions) {
        this.swaggerSpec.definition = {
            openapi: '3.0.0',
            info: {
                title: options.title,
                description: options.description,
                version: options.version
            }
        }
    }

    addSchema(typeName: string, schema: Schema): void {
        this.schemas.set(typeName, schema)
        this.components.schemas = [...this.schemas.entries()].reduce((
                accumulator,
                [typeName, schema]
            ) => ({...accumulator, [typeName]: schema}), {})
        this.swaggerSpec.definition!.components = this.components
    }

    getPath(path: string): SwaggerPathItem | undefined {
        return this.paths.get(path)
    }

    addPath(
        path: string,
        pathItem: SwaggerPathItem
    ): void {
        this.paths.set(path, pathItem)
        this.swaggerSpec.definition!.paths = [...this.paths.entries()].reduce((
            accumulator,
            [key, value],
        ) => ({...accumulator, [key]: value.pathItem}), {}) as Paths
    }

    addTag(tag: string) {
        if (!this.swaggerSpec.definition!.tags) {
            this.swaggerSpec.definition!.tags = []
        }
        this.swaggerSpec.definition!.tags = [...this.swaggerSpec.definition!.tags, {
            name: tag
        }]
    }
}
