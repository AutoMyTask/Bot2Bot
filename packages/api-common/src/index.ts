import e, {Request, RequestHandler} from "express";
import {interfaces} from "inversify";
import {New} from "./types";


export namespace AppCore {
    export type ConfigHost = { port?: string }

    export type UseAppCallback = ((app: IApp) => void)

    export interface IApp {
        app: e.Application,
        conventions: RouteCore.IRouteConventions[],
        services: IServiceCollection,
        mapEndpoints: () => void
        run: (config: AppCore.ConfigHost) => void
        useAuthentification: () => IApp
        use: (callback: (app: IApp) => void) => IApp
    }

}

export namespace RouteCore {
    import Params = RequestCore.Params;
    export type CallbackRouteMapBuilder<T extends void | IRouteMapBuilder> = (routeMapBuilder: IRouteMapBuilder) => T

    export interface IRouteMapBuilder {
        services: IServiceCollection;
        map: (path: string, methode: HTTPMethod, controllerType: New, controllerFunction: Function) => IEndpointRouteBuilder
        mapGroup: (prefix: string) => IGroupedEndpointRouteBuilder;
        routesBuilders: IBaseRouteBuilder[];
        extensions: (callback: CallbackRouteMapBuilder<void>) => IRouteMapBuilder
    }


    export type HTTPMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

    export interface IRouteConventions {
        requestHandler: RequestCore.IRequestHandlerBuilder,
        prefixes: symbol[],
        middlewares: RequestHandler[],
        params: {
            path: Params.Param<Params.ParamPathType>[]
        },
        body?: TypesCore.New,
        path: string,
        method: HTTPMethod,
        auth?: {
            schemes?: string[]
        },
        metadataCollection: IMetadataCollection
    }

    export interface IEndpointRouteBuilder {
        allowAnonymous: () => IEndpointRouteBuilder,
        requireAuthorization: () => IEndpointRouteBuilder,
        withMetadata: (...metadata: object[]) => IEndpointRouteBuilder
        withMiddleware: (middleware: RequestHandler) => IEndpointRouteBuilder
    }

    export interface IBaseRouteBuilder {
        middlewares: RequestHandler[]

        requireAuthorization(): this

        allowAnonymous(): this

        withMiddleware(middleware: RequestHandler): this

        withMetadata(...metadata: object[]): this

        buildRouteConventions(): IRouteConventions[]
    }

    export interface IGroupedEndpointRouteBuilder {
        withMetadata: (metadata: object) => IGroupedEndpointRouteBuilder,
        withMiddleware: (middleware: RequestHandler) => IGroupedEndpointRouteBuilder
        map: (path: string, method: HTTPMethod, controllerType: New, controllerFunction: Function) => IEndpointRouteBuilder,
        mapGroup: (prefix: string) => IGroupedEndpointRouteBuilder,
        allowAnonymous: () => IGroupedEndpointRouteBuilder
        requireAuthorization: () => IGroupedEndpointRouteBuilder
    }

    export interface IMetadataCollection {
        items: object[]

        getAllMetadataAttributes<T extends TypesCore.New>(type: T): InstanceType<T>[]

        push(...metadata: object[]): void
    }
}


export namespace TypesCore {
    export type New = new (...args: any[]) => {}
}


export namespace RequestCore {

    export namespace Params {
        export type ArgHandler = InstanceType<TypesCore.New> | number | string | any

        export type ParamPathType = string | number | 'int' | 'float'
        export type ParamType = TypesCore.New | ParamPathType | ParamServiceType
        export type Param<TParam extends ParamType> = { name: string, type: TParam, required?: boolean }
        export type ParamServiceType = TypesCore.New | string

        export interface IParamsDecorator<T extends ParamType> {
            metadata: Record<number, Param<T> & { index: number }> // Utiliser un tableau et non un record
            metadataKey: 'body' | 'services' | 'params' | 'map',

            add(index: number, option?: { required?: boolean, type?: T, name?: string }): void

            get values(): (Param<T> & { index: number })[]
        }

        export interface IParamsBodyDecorator extends IParamsDecorator<TypesCore.New> {
        }

        export interface IParamsMapDecorator extends IParamsDecorator<any> {
        }

        export interface IParamsPathDecorator extends IParamsDecorator<ParamPathType> {
        }

        export interface IParamsServiceDecorator extends IParamsDecorator<ParamServiceType> {
        }

        export interface IParamsBuilder {
            createParamsArg(req: Request): IParamsBuilder

            createMapArg(req: Request): IParamsBuilder

            createBodyArg(req: Request): IParamsBuilder

            get getArgs(): ArgHandler[],

            paramsPath: IParamsPathDecorator,
            paramBody: IParamsBodyDecorator,
            paramsService: IParamsServiceDecorator,
            paramsMap: IParamsMapDecorator
        }
    }

    export interface IRequestHandlerBuilder {
        paramsBuilder: Params.IParamsBuilder,

        get argsHandler(): RequestHandler,

        get finalHandler(): RequestHandler
    }
}

export type ConfigureServiceCallback = (services: IServiceCollection) => void
export interface IServiceCollection extends interfaces.Container {}

