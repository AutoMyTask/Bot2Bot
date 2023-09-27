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
import {App, IApp} from "./app";

export type ConfigureServiceCallback = (services: interfaces.Container) => void
type AuthentificationBuilderCallback = (builder: AuthentificationBuilder) => void

export interface IAppBuilder {
    addEndpoint: (callback: CallbackRouteMapBuilder<IRouteMapBuilder>) => IRouteMapBuilder;
    configure: (configureServiceCallback: ConfigureServiceCallback) => IAppBuilder;
    build: () => IApp,
    addAuthentification: (handler: RequestHandler, schemes: SecurityType[], callback?: AuthentificationBuilderCallback) => IAppBuilder
}
export class AppBuilder implements IAppBuilder, IRouteMapBuilder {
    private readonly app: Application = express() // Pas dans le builder mais dans App
    private static readonly services: interfaces.Container = new Container()
    public readonly routesBuilders: BaseRouteBuilder[] = []
    public readonly services: interfaces.Container = AppBuilder.services
    public conventions: IRouteConventions[] = []

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

    configure(configureServiceCallback: ConfigureServiceCallback): IAppBuilder {
        configureServiceCallback(this.services)
        return this
    }

    public static createAppBuilder(): IAppBuilder {
        return new AppBuilder()
    }

    addEndpoint(callbackEndpointBuilder: CallbackRouteMapBuilder<IRouteMapBuilder>): IRouteMapBuilder {
        callbackEndpointBuilder(this)
        return this
    }

    build(): IApp {
        this.conventions = this.routesBuilders.reduce((conventions, routeBuilder) => {
            conventions.push(...routeBuilder.buildRouteConventions())
            return conventions
        }, [] as IRouteConventions[])

        return new App(this.services, this.conventions, this.app)
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
}
