import express, {Application, RequestHandler} from "express";
import {Container} from "inversify";
import {BaseRouteBuilder} from "./routes/base.route.builder";
import {SecurityType} from "./auth/types";
import {AuthentificationBuilder} from "./auth/authentification.builder";
import {EndpointRouteBuilder} from "./routes/endpoint.route.builder";
import {RequestHandlerBuilder} from "./request/request.handler.builder";
import {GroupedRouteBuilder} from "./routes/grouped.route.builder";
import "reflect-metadata";
import {App} from "./app";
import {AppCore, ConfigureServiceCallback, IServiceCollection, RouteCore, TypesCore} from "core-types";


type AuthentificationBuilderCallback = (builder: AuthentificationBuilder) => void

export interface IAppBuilder {
    addEndpoint: (callback: RouteCore.CallbackRouteMapBuilder<RouteCore.IRouteMapBuilder>) => RouteCore.IRouteMapBuilder;
    configure: (...configureServiceCallbacks: ConfigureServiceCallback[]) => IAppBuilder;
    build: () => AppCore.IApp,
    addAuthentification: (handler: RequestHandler, schemes: SecurityType[], callback?: AuthentificationBuilderCallback) => IAppBuilder
}
export class AppBuilder implements IAppBuilder,  RouteCore.IRouteMapBuilder{
    private readonly app: Application = express() // Pas dans le builder mais dans App
    private static readonly services: IServiceCollection = new Container()
    public readonly routesBuilders: BaseRouteBuilder[] = []
    public readonly services: IServiceCollection = AppBuilder.services
    public conventions: RouteCore.IRouteConventions[] = []

    private constructor() {}

    addAuthentification(handler: RequestHandler, schemes: SecurityType[], callback?: AuthentificationBuilderCallback): IAppBuilder {
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

    configure(...configureServiceCallbacks: ConfigureServiceCallback[]): IAppBuilder {
        for (const callback of configureServiceCallbacks) {
            callback(this.services)
        }
        return this
    }

    public static createAppBuilder(): IAppBuilder {
        return new AppBuilder()
    }

    addEndpoint(callbackEndpointBuilder: RouteCore.CallbackRouteMapBuilder<RouteCore.IRouteMapBuilder>): RouteCore.IRouteMapBuilder {
        callbackEndpointBuilder(this)
        return this
    }

    build(): AppCore.IApp {
        this.conventions = this.routesBuilders.reduce((conventions, routeBuilder) => {
            conventions.push(...routeBuilder.buildRouteConventions())
            return conventions
        }, [] as RouteCore.IRouteConventions[])

        return new App(this.services, this.conventions, this.app)
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
                this.services
            ),
            path,
            method,
        )

        this.routesBuilders.push(endpointRouteBuilder);
        return endpointRouteBuilder
    }

    mapGroup(prefix: string): RouteCore.IGroupedEndpointRouteBuilder {
        const groupedRouteBuilder = new GroupedRouteBuilder(prefix, this)
        this.routesBuilders.push(groupedRouteBuilder)
        return groupedRouteBuilder
    }

    extensions(callback: RouteCore.CallbackRouteMapBuilder<void>): RouteCore.IRouteMapBuilder {
        callback(this)
        return this;
    }
}

