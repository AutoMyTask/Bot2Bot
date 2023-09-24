import {BaseRouteBuilder} from "./base.route.builder";
import {RequestHandlerBuilder} from "../request/request.handler.builder";
import {MetadataCollection} from "./metadata.collection";
import {AuthentificationBuilder} from "../auth/authentification.builder";
import e, {RequestHandler} from "express";
import {HTTPMethod} from "./types";
import {Param, ParamPathType} from "../request/params/types";
import {New} from "../types";

export interface IRouteConventions {
    groupedMiddlewares: RequestHandler[],
    prefixes: symbol[],
    handler: RequestHandler,
    middlewares: RequestHandler[],
    params: {
        path: Param<ParamPathType>[]
    },
    body?: New,
    path: string,
    method: HTTPMethod,
    auth?: {
        schemes?: string[]
    },
    metadataCollection: MetadataCollection
}


export interface IEndpointRouteBuilder {
    allowAnonymous: () => IEndpointRouteBuilder,
    withMetadata: (...metadata: object[]) => IEndpointRouteBuilder
    withMiddleware: (middleware: RequestHandler) => IEndpointRouteBuilder
}


export class EndpointRouteBuilder extends BaseRouteBuilder implements IEndpointRouteBuilder {
    constructor(
        private requestHandlerBuilder: RequestHandlerBuilder,
        private path: string,
        private method: HTTPMethod,
        private isAuth = false
    ) {
        super();

        if (!/^\/([^/]+(\/[^/]+)*|[^/]+)$/.test(path)) {
            throw new Error(`Invalid route format for '${path}'. Please use '/{string}/...' format.`)
        }
    }

    allowAnonymous(): IEndpointRouteBuilder {
        this.isAuth = false
        return this
    }

    buildRouteConventions(): IRouteConventions[] {
        const body = this.requestHandlerBuilder.paramsBuilder.paramBody.values.at(0)?.type

        const routeConventions: IRouteConventions = {
            prefixes: [],
            groupedMiddlewares: [],
            middlewares: [
                this.requestHandlerBuilder.argsHandler,
                ...this.middlewares
            ],
            handler: this.requestHandlerBuilder.finalHandler,
            params: {
                path: this.requestHandlerBuilder.paramsBuilder.paramsPath.values
            },
            method: this.method,
            path: this.path,
            body,
            metadataCollection: this.metadataCollection
        }
        return [routeConventions]
    }


    buildRouter(): e.Router {
        const router = e.Router()

        const [routeConventions] = this.buildRouteConventions()

        router[routeConventions.method](
            routeConventions.path,
            ...routeConventions.middlewares,
            routeConventions.handler
        )

        return router
    }
}
