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


abstract class EndpointSource {
    abstract get router(): express.Router

    abstract get routeConventions(): IRouteConventions[]
}

class GroupedEndpoint extends EndpointSource {
    constructor(private groupedRouteBuilder: GroupedRouteBuilder) {
        super()
    }

    override get routeConventions(): IRouteConventions[] {
        return []
    }

    override get router(): express.Router {
        const router = e.Router()

        const routers = this.groupedRouteBuilder.routesBuilders.map(routeBuilder => routeBuilder.buildRouter())

        router.use(
            this.groupedRouteBuilder.prefix,
            this.groupedRouteBuilder.middlewares,
            routers
        )

        return router
    }
}


export class GroupedRouteBuilder extends BaseRouteBuilder implements IGroupedEndpointRouteBuilder, IRouteMapBuilder {
    public services: interfaces.Container
    public routesBuilders: BaseRouteBuilder[] = []
    private isAuth?: boolean = undefined

    constructor(
        public prefix: string,
        private routeMapBuilder: IRouteMapBuilder,
        private completePrefix: string = prefix,
        protected metadataCollection: MetadataCollection = new MetadataCollection()
    ) {
        super(metadataCollection);

        new GroupedEndpoint(this)

        if (!/^\/([^/]+(\/[^/]+)*|[^/]+)$/.test(prefix)) {
            throw new Error(`Invalid prefix format for '${prefix}'. Please use '/{string}/...' format.`)
        }

        this.services = routeMapBuilder.services
    }


    allowAnonymous(): IGroupedEndpointRouteBuilder {
        // Idem throw si AuthentificationBuilder est undefenid
        this.isAuth = false
        return this
    }

    map(
        path: string,
        method: HTTPMethod,
        controllerType: New,
        controllerFunction: Function
    ): IEndpointRouteBuilder {

        let authentificationBuilder: AuthentificationBuilder | undefined
        if (this.services.isBound(AuthentificationBuilder)) {
            authentificationBuilder = this.services.get(AuthentificationBuilder)
        }

        const paramBuilder = new ParamsBuilder(
            new ParamsPathDecorator(controllerType, controllerFunction.name),
            new ParamsBodyDecorator(controllerType, controllerFunction.name),
            new ParamsServiceDecorator(controllerType, controllerFunction.name),
            this.services
        )


        const endpointRouteBuilder = new EndpointRouteBuilder(
            new RequestHandlerBuilder(
                controllerType,
                controllerFunction,
                paramBuilder
            ),
            path,
            method,
            this.completePrefix,
            _.cloneDeep(this.metadataCollection), // Ne devrait pas être injecté
            authentificationBuilder,
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
            this.completePrefix + prefix, // Ne devrait pas être injecté
            _.cloneDeep(this.metadataCollection) // Ne également pas être injecté
        )

        this.routeMapBuilder.routesBuilders.push(groupedBuilder)

        return groupedBuilder
    }

    buildRouteConventions(): IRouteConventions[] {

        const routeConventionsSubRoute = this.routesBuilders
            .reduce((requestsHandlersConventions, subRoute) => {
                return [...requestsHandlersConventions, ...subRoute.buildRouteConventions() ?? []]
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
