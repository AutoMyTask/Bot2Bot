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


export interface ISingleRouteBuilder {
    allowAnonymous: () => ISingleRouteBuilder,
    withMetadata: (metadata: object) => ISingleRouteBuilder
    withMiddleware: (middleware: RequestHandler) => ISingleRouteBuilder
}

export class SingleRouteBuilder extends BaseRouteBuilder implements ISingleRouteBuilder {
    public readonly requestHandlerConvention: IRouteConventions

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

        this.requestHandlerConvention = {
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

    allowAnonymous(): ISingleRouteBuilder {
        if (!this.authentificationBuilder) {
            // Trouver un meilleur message
            throw new Error("Tu ne peux pas utiliser cette fonctionnalité tant que tu n'as pas config l'auth")
        }
        this.isAuth = false
        return this
    }

    buildRouteConventions(): IRouteConventions[] {
        if (this.authentificationBuilder && this.isAuth) {
            this.requestHandlerConvention.auth = {
                schemes: this.authentificationBuilder.schemes
            }
        }
        return [this.requestHandlerConvention]
    }


    buildRouter(): e.Router {
        const router = e.Router()

        if (this.authentificationBuilder && this.isAuth) {
            this.withMiddleware(this.authentificationBuilder.handler)
        }

        this.withMiddleware(this.requestHandlerBuilder.argsHandler)

        router[this.requestHandlerConvention.method](
            this.requestHandlerConvention.path,
            ...this.middlewares,
            this.requestHandlerBuilder.finalHandler
        )

        return router
    }
}
