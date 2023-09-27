import {BaseRouteBuilder} from "./base.route.builder";
import {RequestHandlerBuilder} from "../request/request.handler.builder";
import {MetadataCollection} from "./metadata.collection";
import e, {RequestHandler} from "express";
import {HTTPMethod} from "./types";
import {Param, ParamPathType} from "../request/params/types";
import {New} from "../types";

export interface IRouteConventions {
    requestHandler: RequestHandlerBuilder,
    prefixes: symbol[],
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
    requireAuthorization: () => IEndpointRouteBuilder,
    withMetadata: (...metadata: object[]) => IEndpointRouteBuilder
    withMiddleware: (middleware: RequestHandler) => IEndpointRouteBuilder
}


export class EndpointRouteBuilder extends BaseRouteBuilder implements IEndpointRouteBuilder {
    constructor(
        private requestHandlerBuilder: RequestHandlerBuilder,
        private path: string,
        private method: HTTPMethod,
    ) {
        super();

        if (!/^\/([^/]+(\/[^/]+)*|[^/]+)$/.test(path)) {
            throw new Error(`Invalid route format for '${path}'. Please use '/{string}/...' format.`)
        }
    }

    buildRouteConventions(): IRouteConventions[] {
        const body = this.requestHandlerBuilder.paramsBuilder.paramBody.values.at(0)?.type

        const routeConventions: IRouteConventions = {
            requestHandler: this.requestHandlerBuilder,
            prefixes: [],
            middlewares: [
                ...this.middlewares
            ],
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
}
