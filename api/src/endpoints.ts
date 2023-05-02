import {Application, Handler, IRoute, IRouterHandler, IRouterMatcher, Router} from "express";
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";
import {inject, injectable} from "inversify";
import e from "express";
import {StatutCodes} from "./http/StatutCodes";
import {Swagger} from "./swagger/swagger";
import {SwaggerSchema} from "./swagger";
import {SwaggerResponse} from "./swagger/swagger.response";
import {SwaggerOperation} from "./swagger/swagger.operation";
import {SwaggerPathItem} from "./swagger/swagger.pathitem";
import {SwaggerRequest} from "./swagger/swagger.request";

export type HTTPMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

class EndpointGroup {
    private readonly _router: Router

    private tag?: string

    constructor(
        private readonly _app: e.Application,
        private readonly _path: string,
        private readonly _swagger: Swagger
    ) {
        this._router = e.Router()
    }

    withTags(tag: string) {
        this._swagger.addTag(tag)
        this.tag = tag
        return this
    }

    map(path: string, method: HTTPMethod, ...handlers: Handler[]) {
        return new Endpoint(
            this._router[method](path, ...handlers),
            path,
            method,
            this._swagger,
            this._app,
            this._path,
            this.tag
        )
    }


}

class Endpoint {

    constructor(
        private readonly _routeHandler: Router | Application,
        private readonly path: string,
        private readonly method: HTTPMethod,
        private readonly _swagger: Swagger,
        private readonly _app: Application,
        private readonly routerPath?: string,
        private readonly tag?: string
    ) {
        if (typeof this._routeHandler === 'function' && this.routerPath) {
            this._app.use(this.routerPath, this._routeHandler)
        }
    }

    request(fileName: string, typeName: string, contentType = 'application/json'): Endpoint {
        const {schema} = new SwaggerSchema(fileName, typeName)
        this._swagger.addSchema(typeName, schema)

        const requestBody = new SwaggerRequest(contentType, schema)

        const pathItem = this._swagger.getPath(this._swaggerPath) ?? new SwaggerPathItem()

        const operation = pathItem.getOperation() ?? new SwaggerOperation(this.tag)
        operation.addRequestBody(requestBody)

        pathItem.addOperation(this.method, operation)
        this._swagger.addPath(this._swaggerPath, pathItem)

        return this
    }

    produce(statusCode: StatutCodes, fileName: string, typeName: string, contentType = 'application/json'): Endpoint {
        const {schema} = new SwaggerSchema(fileName, typeName)
        this._swagger.addSchema(typeName, schema)
        const response = new SwaggerResponse(statusCode, contentType, schema)

        const pathItem = this._swagger.getPath(this._swaggerPath) ?? new SwaggerPathItem()

        const operation = pathItem.getOperation() ?? new SwaggerOperation(this.tag)
        operation.addResponse(response)

        pathItem.addOperation(this.method, operation)
        this._swagger.addPath(this._swaggerPath, pathItem)

        return this
    }


    private get _swaggerPath(): string {
        return !this.routerPath ? this.path : this.routerPath + this.path
    }

}


@injectable()
export class Endpoints {
    constructor(
        @inject('Application') private _app: e.Application,
        @inject(Swagger) private readonly _swagger: Swagger
    ) {
        this._swagger.addInfo({
            title: 'Mon API',
            version: '1.0.0',
            description: 'Description de mon API'
        })
    }

    setupSwaggerRoute(): void {
        this._app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerJSDoc(this._swagger.swaggerSpec)))
    }


    map(path: string, method: HTTPMethod, ...handlers: Handler[]): Endpoint {
        return new Endpoint(
            this._app[method](path, ...handlers),
            path,
            method,
            this._swagger,
            this._app
        )
    }

    mapGroup(path: string): EndpointGroup {
        return new EndpointGroup(this._app, path, this._swagger)
    }
}
