import {RequestHandler} from "express";
import {Container} from "inversify";
import {SecurityType} from "./auth/types";
import {AuthentificationBuilder} from "./auth/authentification.builder";
import "reflect-metadata";
import {App} from "./app";
import {AppCore, Auth, ConfigureServiceCallback, IServiceCollection} from "api-core-types";

export class AppBuilder implements AppCore.IAppBuilder {
    private static readonly services: IServiceCollection = new Container()
    public readonly services: IServiceCollection = AppBuilder.services

    private constructor() {
    }

    addAuthentification(handler: RequestHandler, schemes: SecurityType[], callback?: Auth.AuthentificationBuilderCallback): AppCore.IAppBuilder {
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

    configure(...configureServiceCallbacks: ConfigureServiceCallback[]): AppCore.IAppBuilder {
        for (const callback of configureServiceCallbacks) {
            callback(this.services)
        }
        return this
    }

    public static createAppBuilder(): AppCore.IAppBuilder {
        return new AppBuilder()
    }

    build(): AppCore.IApp {
        return new App(this.services)
    }
}

