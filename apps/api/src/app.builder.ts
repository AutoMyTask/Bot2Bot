import {Container, interfaces} from "inversify";
import express from "express";
import e, {Application, NextFunction, Request, RequestHandler, Response} from "express";
import {RequestHandlerParams} from "express-serve-static-core";
import _, {isNull} from 'lodash'
import createHttpError from "http-errors";

export type HTTPMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'
type Constructor = new (...args: any[]) => {};


export function Body(requestType: Constructor) {
    return (
        target: Constructor,
        methodName: string,
        parameterIndex: number
    ) => {
        const existingMetadata: ParamsHandler = Reflect.getMetadata('body', target, methodName) ?? {}

        const updateMetadata: ParamsHandler = {
            ...existingMetadata, [parameterIndex]: {
                name: requestType.name,
                type: requestType
            }
        }

        if (Object.values(updateMetadata).length > 1){
            throw new Error('Only one @Body() decorator is allowed in the method.')
        }

        Reflect.defineMetadata('body', updateMetadata, target, methodName)
    }
}


export function Params(paramName: string, type?: 'int' | 'float') {
    return (
        target: Constructor,
        methodName: string,
        parameterIndex: number
    ) => {
        const existingMetadata = Reflect.getMetadata('params', target, methodName) || {}
        const paramTypesHandler = Reflect.getMetadata('design:paramtypes', target, methodName);
        const type = paramTypesHandler[parameterIndex]

        if (type !== Number && type !== String){
            throw new Error(`The '${paramName}' parameter should be a Number or a String, but a ${type.name} was provided.`)
        }

        const updateMetadata: ParamsHandler = {
            ...existingMetadata, [parameterIndex]: {
                name: paramName,
                type: type ?? paramTypesHandler[parameterIndex]
            }
        }
        Reflect.defineMetadata('params', updateMetadata, target, methodName);
    }
}


class MetadataCollection {
    public items: object[] = []

    push(...metadata: object[]) {
        this.items.push(...metadata)
    }

    getAllMetadataAttributes<T extends Constructor>(type: T): InstanceType<T>[] {
        return this.items
            .filter(metadata => metadata instanceof type)
            .map(metadata => metadata as InstanceType<T>);
    }
}

interface IRequestHandler {
    handler: RequestHandler,
    middlewares: RequestHandler[]
}

export type ParamsConventions = {
    path: [{
        name: string,
        type: number | string | boolean
    }]
}

export interface IRequestHandlerConventions {
    params: ParamsConventions,
    body: object,
    path: string,
    method: HTTPMethod,
    fullPath: string,
    metadataCollection: MetadataCollection
}

type ParamTypeHandler = string | number | Constructor | 'int' | 'float'

type ParamsHandler = { [key: string]: { name: string, type: ParamTypeHandler } }


function parseNumber(input: string): number | null {
    const floatValue: number = parseFloat(input);
    if (!isNaN(floatValue)) {
        return floatValue;
    }

    const intValue: number = parseInt(input, 10);
    if (!isNaN(intValue)) {
        return intValue;
    }

    return null
}


class RequestHandlerBuilder {
    private middlewares: RequestHandler[] = []
    private readonly paramsHandler?: ParamsHandler
    public readonly requestHandlerConvention: IRequestHandlerConventions;

    constructor(
        private readonly controllerType: Constructor,
        private readonly controllerMethod: ControllerMethod,
        private readonly path: string,
        private readonly method: HTTPMethod,
        private readonly prefix: string = '',
        private readonly metadataCollection: MetadataCollection = new MetadataCollection()
    ) {
        const paramsHandler: ParamsHandler =
            Reflect.getMetadata('params', this.controllerType, this.controllerMethod.name)

        const paramBodyHandler: ParamsHandler =
            Reflect.getMetadata('body', this.controllerType, this.controllerMethod.name)

        this.paramsHandler = {...paramsHandler ?? {}, ...paramBodyHandler ?? {}}

        const bodyType = Object.values(paramBodyHandler ?? {}).at(0)?.type as Constructor

        this.requestHandlerConvention = {
            params: {
                // @ts-ignore
                path: this.paramsHandler
                    ? Object.values(paramsHandler).map(({ name, type }) => ({ name, type}))
                    : []
            },
            method,
            path,
            fullPath: this.prefix + this.path,
            body: bodyType ? new bodyType() : {},
            metadataCollection: this.metadataCollection
        }
    }

    addMetadata(metadata: object) {
        this.metadataCollection.push(metadata)
    }

    addMiddleware(middleware: RequestHandler) {
        this.middlewares.push(middleware)
    }

    build(): IRequestHandler {
        const handler = async (req: Request, res: Response, next: NextFunction) => {
            try {
                const args = Array
                    .from({length: this.controllerMethod.length}, (_, index) => index)
                    .reduce((args, index) => {
                        const arg = this.paramsHandler ? this.paramsHandler[index] : undefined

                        if (!_.isEmpty(arg)) {
                            if (
                                !_.isEmpty(req.params)
                            ) {

                                if (arg?.type === 'float') {
                                    if (!/^\d+(\.\d+)?$/.test(req.params[arg.name])) {
                                        throw createHttpError.BadRequest(
                                            `The '${arg?.name}' parameter should be a float, but a ${
                                                typeof req.params[arg.name]
                                            } was provided.`
                                        )
                                    }
                                    args[index] = Number.parseFloat(req.params[arg.name])
                                    return args
                                }

                                if (arg?.type === 'int') {
                                    if (!/^\d+$/.test(req.params[arg.name])) {
                                        throw createHttpError.BadRequest(
                                            `The '${arg?.name}' parameter should be a integer, but a ${
                                                typeof req.params[arg.name]
                                            } was provided.`
                                        )
                                    }
                                    args[index] = Number.parseInt(req.params[arg.name])
                                    return args
                                }

                                if (arg.type === Number) {
                                    args[index] = parseNumber(req.params[arg.name])
                                    if (isNull(args[index])) {
                                        throw createHttpError.BadRequest(
                                            `The '${arg?.name}' parameter should be a number, but a ${
                                                typeof req.params[arg.name]
                                            } was provided.`
                                        )
                                    }
                                    return args
                                }
                            }

                            if (
                                !_.isEmpty(req.body) &&
                                typeof arg?.type === 'function' &&
                                arg.type !== Number &&
                                arg.type !== String
                            ) {
                                args[index] = req['body']
                                return args
                            }

                            args[index] = req.params[arg.name]
                        }

                        return args
                    }, [] as any[])


                const result = this.controllerMethod.apply(this.controllerType, args)
                if (result instanceof Promise) {
                    return res.json(await result)
                } else {
                    return res.json(result)
                }

            } catch (err: any) {
                next(err)
            }
        }
        return {
            handler,
            middlewares: this.middlewares
        }
    }
}

interface IRouteBuilder {
    buildRouter: () => express.Router,
    buildRouteHandlers: () => IRequestHandlerConventions[]
}

class RouteHandlerBuilder implements ISingleRouteBuilder, IRouteBuilder {
    private requestHandlerBuilders: RequestHandlerBuilder[] = []

    constructor(
        private readonly prefix: string = '',
        private metadataCollection: MetadataCollection = new MetadataCollection()) {
    }

    addRequestHandler(
        controllerType: Constructor,
        controllerMethod: ControllerMethod,
        path: string,
        method: HTTPMethod,
    ): RouteHandlerBuilder {
        this.requestHandlerBuilders.push(
            new RequestHandlerBuilder(
                controllerType,
                controllerMethod,
                path,
                method,
                this.prefix,
                _.cloneDeep(this.metadataCollection)
            )
        )
        return this
    }

    withMiddleware(middleware: RequestHandler): ISingleRouteBuilder {
        this.requestHandlerBuilders.at(this.requestHandlerBuilders.length - 1)!.addMiddleware(middleware)
        return this
    }

    buildRouteHandlers(): IRequestHandlerConventions[] {
        return this.requestHandlerBuilders.map(
            requestHandlerBuilder => (
                requestHandlerBuilder.requestHandlerConvention
            )
        )

    }

    buildRouter(): e.Router {
        const router = e.Router()

        const requestHandlers = this.requestHandlerBuilders.map(requestHandlerBuilder => ({
            ...requestHandlerBuilder.build(),
            requestHandlerConvention: requestHandlerBuilder.requestHandlerConvention
        }))

        for (let {requestHandlerConvention, handler, middlewares} of requestHandlers) {
            router[requestHandlerConvention.method](requestHandlerConvention.path, ...middlewares, handler)
        }

        return router
    }

    withMetadata(metadata: object): ISingleRouteBuilder {
        this.requestHandlerBuilders
            .at(this.requestHandlerBuilders.length - 1)!
            .addMetadata(metadata)

        return this;
    }
}


interface ISingleRouteBuilder {
    withMetadata: (metadata: object) => ISingleRouteBuilder
    withMiddleware: (middleware: RequestHandler) => ISingleRouteBuilder
}

interface IGroupedRouteBuilder {
    withMetadata: (metadata: object) => IGroupedRouteBuilder,
    withMiddleware: (middleware: RequestHandler) => IGroupedRouteBuilder
    map: (path: string, method: HTTPMethod, controllerType: Constructor, controllerMethod: ControllerMethod) => ISingleRouteBuilder,
    mapGroup: (prefix: string) => IGroupedRouteBuilder
}


class GroupedRouteBuilder implements IGroupedRouteBuilder, IRouteMapBuilder, IRouteBuilder {
    public services: interfaces.Container
    public dataSources: EndpointDataSource[] = []
    private middlewares: RequestHandler[] = []
    private routeHandleBuilder?: RouteHandlerBuilder
    private subgroupsRouteBuilder: { [key: string]: GroupedRouteBuilder } = {}

    constructor(
        private prefix: string,
        private routeMapBuilder: IRouteMapBuilder,
        private completePrefix: string = prefix,
        private metadataCollection: MetadataCollection = new MetadataCollection()
    ) {
        this.services = routeMapBuilder.services
    }

    withMiddleware(
        middleware: RequestHandler
    ): IGroupedRouteBuilder {
        this.middlewares.push(middleware);
        return this
    }

    map(
        path: string,
        method: HTTPMethod,
        controllerType: Constructor,
        controllerMethod: ControllerMethod
    ): ISingleRouteBuilder {
        this.routeHandleBuilder = this.routeHandleBuilder ?? new RouteHandlerBuilder(
            this.completePrefix,
            _.cloneDeep(this.metadataCollection)
        )

        this.routeHandleBuilder.addRequestHandler(
            controllerType,
            controllerMethod,
            path,
            method
        )
        return this.routeHandleBuilder;
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

        this.subgroupsRouteBuilder = {
            ...this.subgroupsRouteBuilder,
            [prefix]: groupedBuilder
        }
        return groupedBuilder
    }

    buildRouteHandlers(): IRequestHandlerConventions[] {
        const requestHandlerConventions = this.routeHandleBuilder?.buildRouteHandlers() ?? []

        const requestHandlerConventionsSubRoute = Object.values(this.subgroupsRouteBuilder)
            .reduce((requestsHandlersConventions, subRoute) => {
                return [...requestsHandlersConventions, ...subRoute.buildRouteHandlers() ?? []]
            }, [] as IRequestHandlerConventions[])

        return [...requestHandlerConventions, ...requestHandlerConventionsSubRoute]
    }

    buildRouter(): express.Router {
        const router = e.Router()
        const routerHandler = this.routeHandleBuilder?.buildRouter() ?? []

        const routers = Object.values(this.subgroupsRouteBuilder)
            .map(subRoute => subRoute.buildRouter())

        router.use(this.prefix, this.middlewares, routerHandler, routers)

        return router
    }

    extensions(callback: CallbackRouteMapBuilder): IRouteMapBuilder {
        callback(this)
        return this;
    }

    withMetadata(metadata: object): IGroupedRouteBuilder {
        this.metadataCollection.push(metadata)
        return this;
    }

}


type CallbackRouteMapBuilder = (routeMapBuilder: IRouteMapBuilder) => void

export interface IRouteMapBuilder {
    services: interfaces.Container;
    map: (path: string, methode: HTTPMethod, controllerType: Constructor, controllerMethod: ControllerMethod) => ISingleRouteBuilder
    mapGroup: (prefix: string) => IGroupedRouteBuilder;
    dataSources: EndpointDataSource[];
    extensions: (callback: CallbackRouteMapBuilder) => IRouteMapBuilder
}

type RouteMapBuilderCallBack = (routeMapBuilder: IRouteMapBuilder) => IRouteMapBuilder

export type ConfigureServiceCallback = (services: interfaces.Container) => void
type ConfigureAppEndpointCallback = (services: interfaces.Container) => IAppEndpoint

interface IApp {
    addMiddleware: (...callbacks: RequestHandlerParams[]) => IApp;
    addEndpoint: (callback: RouteMapBuilderCallBack) => IRouteMapBuilder;
    addAppEndpoint: (routeAppHandler: IAppEndpoint | ConfigureAppEndpointCallback) => IApp
    run: () => void;
    configure: (configureServiceCallback: ConfigureServiceCallback) => void;
    mapEndpoints: () => void
}

export interface IAppEndpoint {
    route: string,
    handlers: RequestHandlerParams[]
}

export class EndpointDataSource {
    constructor(public readonly routeBuilder: IRouteBuilder) {
    }

    public getRouters(): express.Router {
        return this.routeBuilder.buildRouter()
    }

    public getHandlers() {
        return this.routeBuilder.buildRouteHandlers()
    }

}


type ControllerMethod = (...args: any[]) => any

export class App implements IApp, IRouteMapBuilder {
    private readonly app: Application = express()
    private static readonly services: interfaces.Container = new Container()
    public readonly dataSources: EndpointDataSource[] = []
    public readonly services: interfaces.Container = App.services

    configure(configureServiceCallback: ConfigureServiceCallback): void {
        configureServiceCallback(this.services)
    }

    addMiddleware(...callbacks: RequestHandlerParams[]): IApp {
        this.app.use(...callbacks)
        return this
    }

    public static createApp(): IApp {
        return new App()
    }

    addEndpoint(callbackEndpointBuilder: RouteMapBuilderCallBack): IRouteMapBuilder {
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
        for (const dataSource of this.dataSources) {
            const router = dataSource.getRouters()
            this.app.use(router)
        }
    }

    run(): void {
        this.app.listen(process.env.PORT, () => {
            console.log(`Server started on port: http://localhost:${process.env.PORT}/docs`)
        })
    }

    map(
        path: string,
        method: HTTPMethod,
        controllerType: Constructor,
        controllerMethod: ControllerMethod
    ): ISingleRouteBuilder {
        const routeHandlerBuilder = new RouteHandlerBuilder()
            .addRequestHandler(
                controllerType,
                controllerMethod,
                path,
                method
            )
        this.createAndAddDataSource(routeHandlerBuilder);
        return routeHandlerBuilder
    }

    mapGroup(prefix: string): IGroupedRouteBuilder {
        const groupedRouteBuilder = new GroupedRouteBuilder(prefix, this)
        this.createAndAddDataSource(groupedRouteBuilder)
        return groupedRouteBuilder
    }

    private createAndAddDataSource(
        routeBuilder: IRouteBuilder,
    ): void {
        const dataSource = new EndpointDataSource(routeBuilder)
        this.dataSources.push(dataSource)
    }

    extensions(callback: CallbackRouteMapBuilder): IRouteMapBuilder {
        callback(this)
        return this;
    }
}

