import {BaseRouteBuilder} from "./base.route.builder";
import {RequestHandlerBuilder} from "../request/request.handler.builder";
import {RouteCore} from "core-types";

export class EndpointRouteBuilder extends BaseRouteBuilder implements RouteCore.IEndpointRouteBuilder {
    constructor(
        private requestHandlerBuilder: RequestHandlerBuilder,
        private path: string,
        private method: RouteCore.HTTPMethod,
    ) {
        super();

        if (!/^\/([^/]+(\/[^/]+)*|[^/]+)$/.test(path)) {
            throw new Error(`Invalid route format for '${path}'. Please use '/{string}/...' format.`)
        }
    }

    buildRouteConventions(): RouteCore.IRouteConventions[] {
        const body = this.requestHandlerBuilder.paramsBuilder.paramBody.values.at(0)?.type

        const routeConventions: RouteCore.IRouteConventions = {
            requestHandler: this.requestHandlerBuilder,
            prefixes: [],
            middlewares: [
                ...this.middlewares
            ],
            params: {
                path: this.requestHandlerBuilder.paramsBuilder.paramsPath.values,
                query: this.requestHandlerBuilder.paramsBuilder.paramsQuery.values
            },
            method: this.method,
            path: this.path,
            body,
            metadataCollection: this.metadataCollection
        }
        return [routeConventions]
    }
}
