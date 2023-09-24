import {CallbackRouteMapBuilder, HTTPMethod, IRouteMapBuilder} from "./routes/types";
import express, {Application, RequestHandler} from "express";
import {Container, interfaces} from "inversify";
import {BaseRouteBuilder} from "./routes/base.route.builder";
import {SecurityType} from "./auth/types";
import {AuthentificationBuilder} from "./auth/authentification.builder";
import {RequestHandlerParams} from "express-serve-static-core";
import {New} from "./types";
import {IEndpointRouteBuilder, EndpointRouteBuilder, IRouteConventions} from "./routes/endpoint.route.builder";
import {RequestHandlerBuilder} from "./request/request.handler.builder";
import {GroupedRouteBuilder, IGroupedEndpointRouteBuilder} from "./routes/grouped.route.builder";
import "reflect-metadata";
import e from "express";
import _ from "lodash";

export type ConfigureServiceCallback = (services: interfaces.Container) => void
type ConfigureAppEndpointCallback = (services: interfaces.Container) => IAppEndpoint
type AuthentificationBuilderCallback = (builder: AuthentificationBuilder) => void

export interface IApp {
    addMiddleware: (...callbacks: RequestHandlerParams[]) => IApp;
    addEndpoint: (callback: CallbackRouteMapBuilder<IRouteMapBuilder>) => IRouteMapBuilder;
    addAppEndpoint: (routeAppHandler: IAppEndpoint | ConfigureAppEndpointCallback) => IApp // A voir c'est bof
    run: () => void;
    configure: (configureServiceCallback: ConfigureServiceCallback) => IApp;
    mapEndpoints: () => void
    useAuthentification: () => void,
    build: () => void,
    addAuthentification: (handler: RequestHandler, schemes: SecurityType[], callback?: AuthentificationBuilderCallback) => IApp
    use: (
        callback: (
            conventions: IRouteConventions[],
            services: interfaces.Container
        ) => void
    ) => void
}

export interface IAppEndpoint {
    route: string,
    handlers: RequestHandler[] | RequestHandlerParams[]
}

type ConfigApp = { port?: string }

export class App implements IApp, IRouteMapBuilder {
    private readonly app: Application = express()
    private static readonly services: interfaces.Container = new Container()
    public readonly routesBuilders: BaseRouteBuilder[] = []
    public readonly services: interfaces.Container = App.services
    private readonly config: ConfigApp
    public conventions: IRouteConventions[] = []

    private constructor(config: ConfigApp) {
        this.config = config
    }

    addAuthentification(handler: RequestHandler, schemes: SecurityType[], callback?: AuthentificationBuilderCallback): IApp {
        this.services.bind('HandlerAuthentification').toConstantValue(handler)
        this.services.bind('Schemes').toConstantValue(schemes)

        this.services
            .bind(AuthentificationBuilder)
            .to(AuthentificationBuilder)
            .inSingletonScope()

        if (callback) {
            callback(this.services.get(AuthentificationBuilder))
        }

        return this
    }

    configure(configureServiceCallback: ConfigureServiceCallback): IApp {
        configureServiceCallback(this.services)
        return this
    }

    addMiddleware(...callbacks: RequestHandlerParams[]): IApp {
        this.app.use(...callbacks)
        return this
    }

    public static createApp(config: ConfigApp): IApp {
        return new App(config)
    }

    addEndpoint(callbackEndpointBuilder: CallbackRouteMapBuilder<IRouteMapBuilder>): IRouteMapBuilder {
        callbackEndpointBuilder(this)
        return this
    }

    addAppEndpoint(routeAppHandler: IAppEndpoint | ConfigureAppEndpointCallback): IApp {
        let handler

        if (typeof routeAppHandler === 'function') {
            handler = routeAppHandler(this.services)
        } else {
            handler = routeAppHandler
        }

        this.app.use(handler.route, ...handler.handlers)
        return this
    }

    useAuthentification(): void {
        if (this.services.isBound(AuthentificationBuilder)) {
            for (let convention of this.conventions) {
                const {handler, schemes} = this.services.get(AuthentificationBuilder)
                convention.middlewares.unshift(handler)
                convention.auth = {schemes}
            }
        }
    }


    build(): void {
        this.conventions = this.routesBuilders.reduce((conventions, routeBuilder) => {
            conventions.push(...routeBuilder.buildRouteConventions())
            return conventions
        }, [] as IRouteConventions[])
    }


    // Normalement j'y aurais uniquement accès à app, le reste c'est app.builder
    mapEndpoints(): void {
        // Pour les endpoints non groupé
        const conventionsWithNullPrefix = this.conventions.filter(convention => convention.prefixes.length === 0)
        const endpointRouters = this.createEndpointRouters(conventionsWithNullPrefix)
        this.app.use(endpointRouters)

        // Pour les endpoints groupé
        const conventionsWithOnePrefix = this.conventions.filter(convention => convention.prefixes.length === 1)
        for (let conventionWithOnePrefix of conventionsWithOnePrefix) {
            const firstPrefix = conventionWithOnePrefix.prefixes[0] // Regrouper les iroutesconventions ayant le même premier prefix commun / trouver un autre mecanisme
            const conventionsWithPrefix = this.conventions.filter(convention => convention.prefixes.includes(firstPrefix))
            const conventionsPrefixesSorted = conventionsWithPrefix
                .sort((a, b) => a.prefixes.length - b.prefixes.length)
            let prefixes: symbol[] = []
            const router = conventionsPrefixesSorted.reduce((router, convention, index, conventions) => {
                if (!_.isEqual(prefixes, convention.prefixes)) {
                    const endpointsConventions = conventions.filter(conventionFilter => _.isEqual(conventionFilter.prefixes, convention.prefixes))
                    const endpointRouters = this.createEndpointRouters(endpointsConventions)
                    const prefix = convention.prefixes[convention.prefixes.length - 1]
                    router.use(prefix?.description ?? '', convention.groupedMiddlewares, router, endpointRouters)
                    prefixes = convention.prefixes
                }
                return router
            }, e.Router())
            this.app.use(router)
        }
    }

    private createEndpointRouters(conventions: IRouteConventions[]): e.Router[] {
        return conventions.reduce((routers, convention) => {
            const router = e.Router()
            router[convention.method](
                convention.path,
                ...convention.middlewares,
                convention.handler
            )
            routers.push(router)
            return routers
        }, [] as e.Router[])
    }


    run(): void {
        this.app.listen(this.config.port ?? 8000, () => {
            console.log(`Server started on port: http://localhost:${this.config.port ?? 8000}/docs`)
        })
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
        )

        this.routesBuilders.push(endpointRouteBuilder);
        return endpointRouteBuilder
    }

    mapGroup(prefix: string): IGroupedEndpointRouteBuilder {
        const groupedRouteBuilder = new GroupedRouteBuilder(prefix, this)
        this.routesBuilders.push(groupedRouteBuilder)
        return groupedRouteBuilder
    }

    extensions(callback: CallbackRouteMapBuilder<IRouteMapBuilder>): IRouteMapBuilder {
        callback(this)
        return this;
    }

    // Appeller extensions peut être une fois tout buildé
    use(
        callback: (
            conventions: IRouteConventions[],
            services: interfaces.Container
        ) => void
    ) {
        callback(this.conventions, this.services)
    }
}
