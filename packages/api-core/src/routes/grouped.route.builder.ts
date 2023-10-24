import {EndpointRouteBuilder,} from "./endpoint.route.builder";
import {BaseRouteBuilder} from "./base.route.builder";
import {RequestHandlerBuilder} from "../request/request.handler.builder";
import { IServiceCollection, RouteCore, TypesCore} from "api-core-types";


export class GroupedRouteBuilder extends BaseRouteBuilder implements RouteCore.IGroupedEndpointRouteBuilder, RouteCore.IRouteMapBuilder {
    public routesBuilders: BaseRouteBuilder[] = []
    private readonly prefixes: symbol[] = []

    constructor(
        public prefix: string,
        private routeMapBuilder: RouteCore.IRouteMapBuilder,
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
    }

    map(
        path: string,
        method: RouteCore.HTTPMethod,
        controllerType: TypesCore.New,
        controllerFunction: Function
    ): RouteCore.IEndpointRouteBuilder {

        const endpointRouteBuilder = new EndpointRouteBuilder(
            new RequestHandlerBuilder(
                controllerType,
                controllerFunction,
            ),
            path,
            method
        )

        this.routesBuilders.push(endpointRouteBuilder)

        return endpointRouteBuilder
    }

    mapGroup(
        prefix: string
    ): RouteCore.IGroupedEndpointRouteBuilder {
        const groupedBuilder = new GroupedRouteBuilder(
            prefix,
            this,
        )

        this.routesBuilders.push(groupedBuilder)
        return groupedBuilder
    }

    buildRouteConventions(): RouteCore.IRouteConventions[] {
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
            }, [] as RouteCore.IRouteConventions[])

        return [...routeConventionsSubRoute]
    }
}
