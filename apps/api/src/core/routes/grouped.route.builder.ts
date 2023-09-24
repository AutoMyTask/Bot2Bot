import express, {RequestHandler} from "express";
import {
    EndpointRouteBuilder,
    IRouteConventions,
    IEndpointRouteBuilder
} from "./endpoint.route.builder";
import {BaseRouteBuilder} from "./base.route.builder";
import {interfaces} from "inversify";
import {MetadataCollection} from "./metadata.collection";
import {AuthentificationBuilder} from "../auth/authentification.builder";
import {ParamsBuilder} from "../request/params/params.builder";
import {ParamsPathDecorator} from "../request/params/decorators/params.path.decorator";
import {ParamsBodyDecorator} from "../request/params/decorators/params.body.decorator";
import {ParamsServiceDecorator} from "../request/params/decorators/params.service.decorator";
import {RequestHandlerBuilder} from "../request/request.handler.builder";
import _ from "lodash";
import e from "express";
import {CallbackRouteMapBuilder, HTTPMethod, IRouteMapBuilder} from "./types";
import {New} from "../types";

export interface IGroupedEndpointRouteBuilder {
    withMetadata: (metadata: object) => IGroupedEndpointRouteBuilder,
    withMiddleware: (middleware: RequestHandler) => IGroupedEndpointRouteBuilder
    map: (path: string, method: HTTPMethod, controllerType: New, controllerFunction: Function) => IEndpointRouteBuilder,
    mapGroup: (prefix: string) => IGroupedEndpointRouteBuilder,
    allowAnonymous: () => IGroupedEndpointRouteBuilder
}

export class GroupedRouteBuilder extends BaseRouteBuilder implements IGroupedEndpointRouteBuilder, IRouteMapBuilder {
    public services: interfaces.Container
    public routesBuilders: BaseRouteBuilder[] = []
    private isAuth?: boolean = undefined
    private readonly prefixes: symbol[] = []

    constructor(
        public prefix: string,
        private routeMapBuilder: IRouteMapBuilder,
    ) {
        super();

        if (routeMapBuilder instanceof GroupedRouteBuilder) {
            this.prefixes.push(...routeMapBuilder.prefixes)
            this.metadataCollection.items.push(...routeMapBuilder.metadataCollection.items)
        }
        this.prefixes.push(Symbol(prefix))

        if (!/^\/([^/]+(\/[^/]+)*|[^/]+)$/.test(prefix)) {
            throw new Error(`Invalid prefix format for '${prefix}'. Please use '/{string}/...' format.`)
        }

        this.services = routeMapBuilder.services
    }


    allowAnonymous(): IGroupedEndpointRouteBuilder {
        this.isAuth = false
        return this
    }

    map(
        path: string,
        method: HTTPMethod,
        controllerType: New,
        controllerFunction: Function
    ): IEndpointRouteBuilder {

        const endpointRouteBuilder = new EndpointRouteBuilder(
            new RequestHandlerBuilder(
                controllerType,
                controllerFunction,
                this.services
            ),
            path,
            method,
            this.isAuth
        )

        this.routesBuilders.push(endpointRouteBuilder)

        return endpointRouteBuilder;
    }

    mapGroup(
        prefix: string
    ): IGroupedEndpointRouteBuilder {
        const groupedBuilder = new GroupedRouteBuilder(
            prefix,
            this,
        )

        this.routesBuilders.push(groupedBuilder)
        return groupedBuilder
    }

    buildRouteConventions(): IRouteConventions[] {
        const routeConventionsSubRoute = this.routesBuilders
            .reduce((requestsHandlersConventions, routeBuilder) => {
                const routeConventions = routeBuilder.buildRouteConventions()

                if (routeBuilder instanceof GroupedRouteBuilder) {
                    return [...requestsHandlersConventions, ...routeConventions]
                }

                for (let routeConvention of routeConventions) {
                    routeConvention.prefixes = [...this.prefixes]
                    routeConvention.metadataCollection.items.push(...this.metadataCollection.items)
                    routeConvention.groupedMiddlewares.push(...this.middlewares)
                }

                return [...requestsHandlersConventions, ...routeConventions ?? []]
            }, [] as IRouteConventions[])

        return [...routeConventionsSubRoute]
    }

    buildRouter(): express.Router {
        const router = e.Router()

        const routers = this.routesBuilders.map(routeBuilder => routeBuilder.buildRouter())

        router.use(this.prefix, this.middlewares, routers)

        return router
    }

    extensions(callback: CallbackRouteMapBuilder<void>): IRouteMapBuilder {
        callback(this)
        return this;
    }
}
