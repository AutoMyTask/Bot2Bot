import {Container, interfaces} from "inversify";
import express from "express";
import e, {Application, NextFunction, Request, RequestHandler, Response} from "express";
import {RequestHandlerParams} from "express-serve-static-core";
import _, {isNull, values} from 'lodash'
import {plainToInstance} from "class-transformer";
import {validateSync} from "class-validator";
import {BadRequestObject} from "./http/errors/BadRequest";


export type HTTPMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'
type Constructor = new (...args: any[]) => {};


export function Body(
    target: Constructor,
    methodName: string,
    parameterIndex: number
) {
    const existingMetadata: ParamsHandler<Constructor> = Reflect.getMetadata('body', target, methodName) ?? {}
    const paramTypesHandler = Reflect.getMetadata('design:paramtypes', target, methodName);

    const type = paramTypesHandler[parameterIndex]

    const updateMetadata: ParamsHandler<Constructor> = {
        ...existingMetadata, [parameterIndex]: {
            name: type.name,
            type
        }
    }

    if (values(updateMetadata).length > 1) {
        throw new Error('Only one @Body() decorator is allowed in the method.')
    }

    Reflect.defineMetadata('body', updateMetadata, target, methodName)

}


export function Service(type: string | Constructor) {
    return (
        target: Constructor,
        methodName: string,
        parameterIndex: number
    ) => {
        const existingMetadata: ParamsHandler<Constructor> = Reflect.getMetadata('services', target, methodName) ?? {}


        const updateMetadata: ParamsHandler<Constructor | string> = {
            ...existingMetadata, [parameterIndex]: {
                type
            }
        }

        Reflect.defineMetadata('services', updateMetadata, target, methodName)
    }
}


export function Params(
    paramName: string,
    options?: { type?: 'int' | 'float' }
) {
    return (
        target: Constructor,
        methodName: string,
        parameterIndex: number
    ) => {
        const existingMetadata = Reflect.getMetadata('params', target, methodName) || {}
        const paramTypesHandler = Reflect.getMetadata('design:paramtypes', target, methodName);
        const type = paramTypesHandler[parameterIndex]

        if (type !== Number && type !== String) {
            throw new Error(`The '${paramName}' parameter should be a Number or a String, but a ${type.name} was provided.`)
        }

        const updateMetadata: ParamsHandler<ParamTypePath> = {
            ...existingMetadata, [parameterIndex]: {
                name: paramName,
                type: options?.type ?? paramTypesHandler[parameterIndex],
                required: true
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
    path: { name: string, type: ParamTypePath, required?: boolean }[]
}

export interface IRequestHandlerConventions {
    params: ParamsConventions,
    body?: Constructor,
    path: string,
    method: HTTPMethod,
    fullPath: string,
    metadataCollection: MetadataCollection
}


export type ParamTypePath = string | number | 'int' | 'float'

type ParamsHandler<T extends Constructor | ParamTypePath> = { [key: string]: { name: string, type: T, required?: boolean } }


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

class HandlerBuilder {

    public readonly paramsPathHandler: ParamsHandler<ParamTypePath> =
        Reflect.getMetadata('params', this.controllerType, this.controllerMethod.name)

    public readonly paramBodyHandler: ParamsHandler<Constructor> =
        Reflect.getMetadata('body', this.controllerType, this.controllerMethod.name)

    public readonly paramsServiceHandler: ParamsHandler<Constructor | string> =
        Reflect.getMetadata('services', this.controllerType, this.controllerMethod.name)

    constructor(
        private readonly controllerType: Constructor,
        private readonly controllerMethod: ControllerMethod,
        private readonly services: interfaces.Container
    ) {
    }

    public build(): RequestHandler {
        return async (req: Request, res: Response, next: NextFunction) => {
            try {
                const args = this.buildArgs(req)

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
    }

    private buildArgs(req: Request): any[] {
        const {paramsServiceHandler, paramsPathHandler, paramBodyHandler} = this

        return Array
            .from({length: this.controllerMethod.length}, (_, index) => index)
            .reduce((args, index) => {
                const argBody = paramBodyHandler ? paramBodyHandler[index] : undefined
                const argService = paramsServiceHandler ? paramsServiceHandler[index] : undefined
                const argPath = paramsPathHandler ? paramsPathHandler[index] : undefined

                if (!_.isEmpty(argService)) {
                    args[index] = this.services.get(argService?.type)
                }

                if (!_.isEmpty(argBody)) {
                    args[index] = plainToInstance(argBody.type, req.body)
                    const errors = validateSync(args[index])

                    if (errors.length > 0) {
                        throw new BadRequestObject(
                            `The provided fields are incorrect`,
                            errors
                        )
                    }
                    return args
                }

                if (!_.isEmpty(argPath)) {
                    if (argPath.type === 'float') {
                        if (!/^\d+(\.\d+)?$/.test(req.params[argPath.name])) {
                            throw new BadRequestObject(
                                `The '${argPath.name}' parameter should be a number, but a ${
                                    typeof req.params[argPath.name]
                                } was provided.`,
                                ['Invalid parameter']
                            )
                        }
                        args[index] = Number.parseFloat(req.params[argPath.name])
                        return args
                    }

                    if (argPath.type === 'int') {
                        if (!/^\d+$/.test(req.params[argPath.name])) {
                            throw new BadRequestObject(
                                `The '${argPath.name}' parameter should be a number, but a ${
                                    typeof req.params[argPath.name]
                                } was provided.`,
                                ['Invalid parameter']
                            )
                        }
                        args[index] = Number.parseInt(req.params[argPath.name])
                        return args
                    }

                    if (typeof argPath.type === 'function' && argPath.type === Number) {
                        args[index] = parseNumber(req.params[argPath.name])
                        if (isNull(args[index])) {
                            throw new BadRequestObject(
                                `The '${argPath.name}' parameter should be a number, but a ${
                                    typeof req.params[argPath.name]
                                } was provided.`,
                                ['Invalid parameter']
                            )
                        }
                        return args
                    }

                    args[index] = req.params[argPath.name]
                    return args
                }

                return args
            }, [] as any[])
    }
}


class RequestHandlerBuilder {
    private middlewares: RequestHandler[] = []
    public readonly requestHandlerConvention: IRequestHandlerConventions;

    constructor(
        private handlerBuilder: HandlerBuilder,
        private readonly path: string,
        private readonly method: HTTPMethod,
        private readonly prefix: string = '',
        private readonly services: interfaces.Container,
        private readonly metadataCollection: MetadataCollection = new MetadataCollection()
    ) {
        const BodyType = values(this.handlerBuilder.paramBodyHandler ?? {}).at(0)?.type

        this.requestHandlerConvention = {
            params: {
                path: values(this.handlerBuilder.paramsPathHandler)
            },
            method,
            path,
            fullPath: this.prefix + this.path,
            body: BodyType,
            metadataCollection: this.metadataCollection
        }
    }

    withMetadata(metadata: object) {
        this.metadataCollection.push(metadata)
    }

    withMiddleware(middleware: RequestHandler) {
        this.middlewares.push(middleware)
    }

    build(): IRequestHandler {
        return {
            handler: this.handlerBuilder.build(),
            middlewares: this.middlewares
        }

    }
}

interface IRouteBuilder {
    buildRouter: () => express.Router,
    buildRouteHandlers: () => IRequestHandlerConventions[]
}


// Je pense que je pourrais refractorer. Supprimer une couche
// et rajouter une classe abstraite au dessus
// Utiliser des classes pour centraliser la logique commune à la partie decorator params
class RouteHandlerBuilder implements ISingleRouteBuilder, IRouteBuilder {
    private requestHandlerBuilders: RequestHandlerBuilder[] = []

    constructor(
        private readonly prefix: string = '',
        private readonly services: interfaces.Container,
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
                new HandlerBuilder(controllerType, controllerMethod, this.services),
                path,
                method,
                this.prefix,
                this.services,
                _.cloneDeep(this.metadataCollection)
            )
        )
        return this
    }

    withMiddleware(middleware: RequestHandler): ISingleRouteBuilder {
        this.requestHandlerBuilders.at(this.requestHandlerBuilders.length - 1)!.withMiddleware(middleware)
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
            .withMetadata(metadata)

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
            this.services,
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

        const requestHandlerConventionsSubRoute = values(this.subgroupsRouteBuilder)
            .reduce((requestsHandlersConventions, subRoute) => {
                return [...requestsHandlersConventions, ...subRoute.buildRouteHandlers() ?? []]
            }, [] as IRequestHandlerConventions[])

        return [...requestHandlerConventions, ...requestHandlerConventionsSubRoute]
    }

    buildRouter(): express.Router {
        const router = e.Router()
        const routerHandler = this.routeHandleBuilder?.buildRouter() ?? []

        const routers = values(this.subgroupsRouteBuilder)
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


export type RouteMapBuilderCallBack = (routeMapBuilder: IRouteMapBuilder) => IRouteMapBuilder

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
        const routeHandlerBuilder = new RouteHandlerBuilder('', this.services)
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

