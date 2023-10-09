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
    export type CallbackRouteMapBuilder<T extends void | IRouteMapBuilder> = (routeMapBuilder: IRouteMapBuilder) => T

    export interface IRouteMapBuilder {
        services: IServiceCollection;
        map: (path: string, methode: HTTPMethod, controllerType: New, controllerFunction: Function) => IEndpointRouteBuilder
        mapGroup: (prefix: string) => IGroupedEndpointRouteBuilder;
        routesBuilders: IBaseRouteBuilder[];
        extensions: (callback: CallbackRouteMapBuilder<void>) => IRouteMapBuilder
    }


    export type HTTPMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

    // Un type et non une interface
    export interface IRouteConventions {
        request: RequestCore.IRequestConventions,
        prefixes: symbol[],
        middlewares: RequestHandler[],
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
        export type ArgHandler = InstanceType<TypesCore.New> | number | string | any | undefined

        export type ParamBodyType = TypesCore.New

        export type ParamServiceType = TypesCore.New | string

        export type ParamPathType = 'number' | 'string' | 'int' | 'float'

        export type ParamQueryType = ParamPathType

        export type ParamType = ParamBodyType | ParamPathType | ParamServiceType | ParamQueryType
        export type Param<T extends ParamType> = { name: string, type: T, required?: boolean }

        export type ParamsConventions = {
            path: RequestCore.Params.Param<ParamPathType>[]
            query: RequestCore.Params.Param<ParamQueryType>[],
            body?: RequestCore.Params.Param<ParamBodyType>
        }


        export interface IParamsDecorator<T extends ParamType> {
            metadata: Record<number, Param<T> & { index: number }> // Utiliser un tableau et non un record
            metadataKey: 'body' | 'services' | 'params' | 'map' | 'query',

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

        export interface IParamsQueryDecorator extends IParamsDecorator<ParamQueryType> {
        }


        export interface IParamsBuilder {
            createParamsArg(req: Request): Promise<IParamsBuilder>

            createMapArg(req: Request): Promise<IParamsBuilder>

            createBodyArg(req: Request): Promise<IParamsBuilder>

            createQueryArg(req: Request): Promise<IParamsBuilder>

            get getArgs(): ArgHandler[],

            paramsPath: IParamsPathDecorator,
            paramBody: IParamsBodyDecorator,
            paramsService: IParamsServiceDecorator,
            paramsMap: IParamsMapDecorator
            paramsQuery: IParamsQueryDecorator
        }
    }


    export type IRequestConventions = {
        handlers: RequestHandler[]
        params: Params.ParamsConventions
    }


    export interface IRequestHandlerBuilder {
        paramsBuilder: Params.IParamsBuilder,

        build(): IRequestConventions,
        get argsHandler(): RequestHandler, // A supprimer

        get finalHandler(): RequestHandler, // A supprimer
    }
}

export type ConfigureServiceCallback = (services: IServiceCollection) => void

export interface IServiceCollection extends interfaces.Container {
}

