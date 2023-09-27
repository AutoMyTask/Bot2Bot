import express, {RequestHandler} from "express";
import {
    EndpointRouteBuilder,
    IRouteConventions,
    IEndpointRouteBuilder
} from "./endpoint.route.builder";
import {BaseRouteBuilder} from "./base.route.builder";
import {interfaces} from "inversify";
import {RequestHandlerBuilder} from "../request/request.handler.builder";
import e from "express";
import {CallbackRouteMapBuilder, HTTPMethod, IRouteMapBuilder} from "./types";
import {New} from "../types";

export interface IGroupedEndpointRouteBuilder {
    withMetadata: (metadata: object) => IGroupedEndpointRouteBuilder,
    withMiddleware: (middleware: RequestHandler) => IGroupedEndpointRouteBuilder
    map: (path: string, method: HTTPMethod, controllerType: New, controllerFunction: Function) => IEndpointRouteBuilder,
    mapGroup: (prefix: string) => IGroupedEndpointRouteBuilder,
    allowAnonymous: () => IGroupedEndpointRouteBuilder
    requireAuthorization: () => IGroupedEndpointRouteBuilder
}

export class GroupedRouteBuilder extends BaseRouteBuilder implements IGroupedEndpointRouteBuilder, IRouteMapBuilder {
    public services: interfaces.Container
    public routesBuilders: BaseRouteBuilder[] = []
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
            method
        )

        this.routesBuilders.push(endpointRouteBuilder)

        return endpointRouteBuilder
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
                    routeConvention.middlewares.unshift(
                        ...this.middlewares
                    )
                }

                return [...requestsHandlersConventions, ...routeConventions ?? []]
            }, [] as IRouteConventions[])

        return [...routeConventionsSubRoute]
    }

    extensions(callback: CallbackRouteMapBuilder<void>): IRouteMapBuilder {
        callback(this)
        return this;
    }
}
