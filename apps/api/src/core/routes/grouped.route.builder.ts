import express, {RequestHandler} from "express";
import {IRouteConventions, ISingleRouteBuilder, SingleRouteBuilder} from "./single.route.builder";
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

export interface IGroupedRouteBuilder {
    withMetadata: (metadata: object) => IGroupedRouteBuilder,
    withMiddleware: (middleware: RequestHandler) => IGroupedRouteBuilder
    map: (path: string, method: HTTPMethod, controllerType: New, controllerFunction: Function) => ISingleRouteBuilder,
    mapGroup: (prefix: string) => IGroupedRouteBuilder,
    allowAnonymous: () => IGroupedRouteBuilder
}

export class GroupedRouteBuilder extends BaseRouteBuilder implements IGroupedRouteBuilder, IRouteMapBuilder {
    public services: interfaces.Container
    public baseRouteBuilders: BaseRouteBuilder[] = []
    private singleRoutesBuilders: SingleRouteBuilder[] = []
    private subgroupsRouteBuilder: GroupedRouteBuilder[] = []
    private isAuth?: boolean = undefined

    constructor(
        private prefix: string,
        private routeMapBuilder: IRouteMapBuilder,
        private completePrefix: string = prefix,
        protected metadataCollection: MetadataCollection = new MetadataCollection()
    ) {
        super(metadataCollection);

        if (!/^\/([^/]+(\/[^/]+)*|[^/]+)$/.test(prefix)) {
            throw new Error(`Invalid prefix format for '${prefix}'. Please use '/{string}/...' format.`)
        }

        this.services = routeMapBuilder.services
    }


    allowAnonymous(): IGroupedRouteBuilder {
        // Idem throw si AuthentificationBuilder est undefenid
        this.isAuth = false
        return this
    }

    map(
        path: string,
        method: HTTPMethod,
        controllerType: New,
        controllerFunction: Function
    ): ISingleRouteBuilder {

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

        const singleRouteBuilder = new SingleRouteBuilder(
            new RequestHandlerBuilder(
                controllerType,
                controllerFunction,
                paramBuilder
            ),
            path,
            method,
            this.completePrefix,
            _.cloneDeep(this.metadataCollection),
            authentificationBuilder,
            this.isAuth
        )

        this.singleRoutesBuilders.push(singleRouteBuilder)

        return singleRouteBuilder;
    }

    mapGroup(
        prefix: string
    ): IGroupedRouteBuilder {

        const groupedBuilder = new GroupedRouteBuilder(
            prefix,
            this,
            this.completePrefix + prefix,
            _.cloneDeep(this.metadataCollection)
        )

        this.subgroupsRouteBuilder.push(groupedBuilder)

        return groupedBuilder
    }

    buildRouteConventions(): IRouteConventions[] {

        const routeConventions = this.singleRoutesBuilders.reduce((requestHandlerConventions, routeHandlerBuilder) => {
            requestHandlerConventions = [...requestHandlerConventions, ...routeHandlerBuilder.buildRouteConventions()]
            return requestHandlerConventions
        }, [] as IRouteConventions[])

        const routeConventionsSubRoute = this.subgroupsRouteBuilder
            .reduce((requestsHandlersConventions, subRoute) => {
                return [...requestsHandlersConventions, ...subRoute.buildRouteConventions() ?? []]
            }, [] as IRouteConventions[])

        return [...routeConventions, ...routeConventionsSubRoute]
    }

    buildRouter(): express.Router {
        const router = e.Router()
        const singleRouters = this.singleRoutesBuilders.map(
            singleRouteBuilder => singleRouteBuilder.buildRouter()
        )

        const subgroupRouters = this.subgroupsRouteBuilder.map(subRoute => subRoute.buildRouter())

        router.use(this.prefix, this.middlewares, singleRouters, subgroupRouters)

        return router
    }

    extensions(callback: CallbackRouteMapBuilder<void>): IRouteMapBuilder {
        callback(this)
        return this;
    }
}
