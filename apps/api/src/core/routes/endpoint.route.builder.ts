import {BaseRouteBuilder} from "./base.route.builder";
import {RequestHandlerBuilder} from "../request/request.handler.builder";
import {MetadataCollection} from "./metadata.collection";
import {AuthentificationBuilder} from "../auth/authentification.builder";
import e, {RequestHandler} from "express";
import {HTTPMethod} from "./types";
import {Param, ParamPathType} from "../request/params/types";
import {New} from "../types";

export interface IRouteConventions {
    params: {
        path: Param<ParamPathType>[]
    },
    body?: New,
    path: string,
    method: HTTPMethod,
    fullPath: string,
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

// lors de la construction des metadata, pour éviter "l'heritage", le passage par refférence
// stocké des callbacks
export class EndpointRouteBuilder extends BaseRouteBuilder implements IEndpointRouteBuilder {
    public readonly routeConventions: IRouteConventions

    constructor(
        private requestHandlerBuilder: RequestHandlerBuilder,
        private path: string,
        private method: HTTPMethod,
        private readonly prefix: string = '',
        protected metadataCollection: MetadataCollection,
        private readonly authentificationBuilder?: AuthentificationBuilder,
        private isAuth = !!authentificationBuilder
    ) {
        super(metadataCollection);

        if (!/^\/([^/]+(\/[^/]+)*|[^/]+)$/.test(path)) {
            throw new Error(`Invalid route format for '${path}'. Please use '/{string}/...' format.`)
        }
        const body = this.requestHandlerBuilder.paramsBuilder.paramBody.values.at(0)?.type

        this.routeConventions = {
            params: {
                path: this.requestHandlerBuilder.paramsBuilder.paramsPath.values
            },
            method,
            path,
            fullPath: this.prefix + this.path,
            body,
            metadataCollection: this.metadataCollection
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

    buildRouteConventions(): IRouteConventions[] {
        if (this.authentificationBuilder && this.isAuth) {
            this.routeConventions.auth = {
                schemes: this.authentificationBuilder.schemes
            }
        }
        return [this.routeConventions]
    }


    buildRouter(): e.Router {
        const router = e.Router()

        if (this.authentificationBuilder && this.isAuth) {
            this.withMiddleware(this.authentificationBuilder.handler)
        }

        this.withMiddleware(this.requestHandlerBuilder.argsHandler)

        router[this.routeConventions.method](
            this.routeConventions.path,
            ...this.middlewares,
            this.requestHandlerBuilder.finalHandler
        )

        return router
    }
}
