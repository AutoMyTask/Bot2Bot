import {BaseRouteBuilder} from "./base.route.builder";
import {RequestHandlerBuilder} from "../request/request.handler.builder";
import {MetadataCollection} from "./metadata.collection";
import {AuthentificationBuilder} from "../auth/authentification.builder";
import e, {RequestHandler} from "express";
import {HTTPMethod} from "./types";
import {Param, ParamPathType} from "../request/params/types";
import {New} from "../types";

export interface IRouteConventions {
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
    withMetadata: (metadata: object) => IEndpointRouteBuilder
    withMiddleware: (middleware: RequestHandler) => IEndpointRouteBuilder
}


export class EndpointRouteBuilder extends BaseRouteBuilder implements IEndpointRouteBuilder {
    constructor(
        private requestHandlerBuilder: RequestHandlerBuilder,
        private path: string,
        private method: HTTPMethod,
        private readonly authentificationBuilder?: AuthentificationBuilder,
        private isAuth = !!authentificationBuilder
    ) {
        super();

        if (!/^\/([^/]+(\/[^/]+)*|[^/]+)$/.test(path)) {
            throw new Error(`Invalid route format for '${path}'. Please use '/{string}/...' format.`)
        }
    }

    allowAnonymous(): IEndpointRouteBuilder {
        if (!this.authentificationBuilder) {
            // Trouver un meilleur message
            throw new Error("Tu ne peux pas utiliser cette fonctionnalité tant que tu n'as pas config l'auth")
        }
        this.isAuth = false
        return this
    }

    // Ajouter un symbole prefix
    // Cela fera [prefix(group), subRoute(subGroup)]
    // Je pourrais construire les routes dynamiquement
    buildRouteConventions(): IRouteConventions[] {
        const body = this.requestHandlerBuilder.paramsBuilder.paramBody.values.at(0)?.type

        const routeConventions: IRouteConventions = {
            prefixes: [],
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

        if (this.authentificationBuilder && this.isAuth) {
            routeConventions.auth = {
                schemes: this.authentificationBuilder.schemes
            }
        }
        return [routeConventions]
    }


    buildRouter(): e.Router {
        const router = e.Router()

        const [routeConventions] = this.buildRouteConventions()

        if (this.authentificationBuilder && this.isAuth) {
            routeConventions.middlewares = [
                this.authentificationBuilder.handler,
                ...routeConventions.middlewares
            ]
        }

        router[routeConventions.method](
            routeConventions.path,
            ...routeConventions.middlewares,
            routeConventions.handler
        )

        return router
    }
}
