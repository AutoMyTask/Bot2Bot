import {CallbackRouteMapBuilder, HTTPMethod, IRouteMapBuilder} from "./routes/types";
import express, {Application, RequestHandler} from "express";
import {Container, interfaces} from "inversify";
import {BaseRouteBuilder} from "./routes/base.route.builder";
import {SecurityType} from "./auth/types";
import {AuthentificationBuilder} from "./auth/authentification.builder";
import {RequestHandlerParams} from "express-serve-static-core";
import {New} from "./types";
import {ISingleRouteBuilder, SingleRouteBuilder} from "./routes/single.route.builder";
import {ParamsBuilder} from "./request/params/params.builder";
import {ParamsPathDecorator} from "./request/params/decorators/params.path.decorator";
import {ParamsBodyDecorator} from "./request/params/decorators/params.body.decorator";
import {ParamsServiceDecorator} from "./request/params/decorators/params.service.decorator";
import {RequestHandlerBuilder} from "./request/request.handler.builder";
import {MetadataCollection} from "./routes/metadata.collection";
import {GroupedRouteBuilder, IGroupedRouteBuilder} from "./routes/grouped.route.builder";
import "reflect-metadata";

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
    addAuthentification: (handler: RequestHandler, schemes: SecurityType[], callback?: AuthentificationBuilderCallback) => IApp
}

export interface IAppEndpoint {
    route: string,
    handlers: RequestHandler[] | RequestHandlerParams[]
}

type ConfigApp = { port?: string }

export class App implements IApp, IRouteMapBuilder {
    private readonly app: Application = express()
    private static readonly services: interfaces.Container = new Container()
    public readonly baseRouteBuilders: BaseRouteBuilder[] = []
    public readonly services: interfaces.Container = App.services
    private readonly config: ConfigApp

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

    mapEndpoints() {
        for (const baseRouteBuilder of this.baseRouteBuilders) {
            const router = baseRouteBuilder.buildRouter()
            this.app.use(router)
        }
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
            new RequestHandlerBuilder(controllerType, controllerFunction, paramBuilder),
            path,
            method,
            '',
            new MetadataCollection(),
            authentificationBuilder
        )

        this.baseRouteBuilders.push(singleRouteBuilder);
        return singleRouteBuilder
    }

    mapGroup(prefix: string): IGroupedRouteBuilder {
        const groupedRouteBuilder = new GroupedRouteBuilder(prefix, this)
        this.baseRouteBuilders.push(groupedRouteBuilder)
        return groupedRouteBuilder
    }

    extensions(callback: CallbackRouteMapBuilder<IRouteMapBuilder>): IRouteMapBuilder {
        callback(this)
        return this;
    }
}
