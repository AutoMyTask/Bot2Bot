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
        const routeConventions: RouteCore.IRouteConventions = {
            request: this.requestHandlerBuilder.build(),
            prefixes: [],
            middlewares: [
                ...this.middlewares
            ],
            method: this.method,
            path: this.path,
            metadataCollection: this.metadataCollection
        }
        return [routeConventions]
    }
}
