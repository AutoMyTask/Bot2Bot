import {Container, interfaces} from "inversify";
import express from "express";
import e, {Application, NextFunction, Request, RequestHandler, Response} from "express";
import {RequestHandlerParams} from "express-serve-static-core";
import {clone, isEmpty} from "radash";
import {MetadataProduce} from "./openapi/metadata/metadataProduce";

export type HTTPMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'
type Constructor = new (...args: any[]) => {};


export function Body(requestType: Constructor) {
    return (
        target: Constructor,
        methodName: string,
        parameterIndex: number
    ) => {
        const metadata: ParamsHandler = {
            [parameterIndex]: {
                body: new requestType() as BodyHandler
            }
        }
        Reflect.defineMetadata('body', metadata, target, methodName)
    }
}


export function Params(paramName: string) {
    return (
        target: Constructor,
        methodName: string,
        parameterIndex: number
    ) => {
        const existingMetadata = Reflect.getMetadata('params', target, methodName) || {}
        const updateMetadata: ParamsHandler = {...existingMetadata, [parameterIndex]: paramName}
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

export type ParamsConventions = { path: string[] }

export interface IRequestHandlerConventions {
    params: ParamsConventions,
    body: object,
    path: string,
    method: HTTPMethod,
    fullPath: string,
    metadataCollection: MetadataCollection
}

type BodyHandler = {
    body: object
}

function instanceOfBodyHandler(object: any): object is BodyHandler {
    return 'body' in object
}

type ParamsHandler = { [key: string]: string | number | BodyHandler }

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

        this.requestHandlerConvention = {
            params: {
                path: this.paramsHandler ? Object.values(paramsHandler).filter(param => typeof param === 'string') as string[] : []
            },
            method,
            path,
            fullPath: this.prefix + this.path,
            body: paramBodyHandler ? (Object.values(paramBodyHandler).at(0) as BodyHandler).body : {},
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
            const args = Array
                .from({length: this.controllerMethod.length}, (_, index) => index)
                .reduce((args, index) => {
                    const arg = this.paramsHandler ? this.paramsHandler[index] : undefined

                    if (arg) {
                        if (!isEmpty(req.params) && typeof arg !== 'object') {
                            args[index] = req.params[arg]
                            return args
                        }
                        if (
                            !isEmpty(req.body) &&
                            !isEmpty(arg) &&
                            instanceOfBodyHandler(arg)) {
                            args[index] = req['body']
                            return args
                        }

                    }
                    return args
                }, [] as any[])

            try {
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
    buildRouteHandlers: () => IGroupeRouteHandlerConventions | IRouteHandlerConventions
}

interface IRouteHandlerConventions {
    requestHandlerConventions: IRequestHandlerConventions[],
}

export interface IGroupeRouteHandlerConventions {
    routesHandlersConventions?: IRouteHandlerConventions,
    subGroups: IGroupeRouteHandlerConventions[],
    prefix: string,
    metadataCollection: MetadataCollection
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
                clone(this.metadataCollection)
            )
        )
        return this
    }

    withMiddleware(middleware: RequestHandler): ISingleRouteBuilder {
        this.requestHandlerBuilders.at(this.requestHandlerBuilders.length - 1)!.addMiddleware(middleware)
        return this
    }

    buildRouteHandlers(): IRouteHandlerConventions {
        const requestHandlerConventions = this.requestHandlerBuilders.map(
            requestHandlerBuilder => (
                requestHandlerBuilder.requestHandlerConvention
            )
        )

        return {requestHandlerConventions}

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
            clone(this.metadataCollection)
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
            clone(this.metadataCollection)
        )

        this.subgroupsRouteBuilder = {
            ...this.subgroupsRouteBuilder,
            [prefix]: groupedBuilder
        }
        return groupedBuilder
    }

    buildRouteHandlers(): IGroupeRouteHandlerConventions {
        const routesHandlersConventions = this.routeHandleBuilder?.buildRouteHandlers()
        let routeHandlers: IGroupeRouteHandlerConventions[] = []

        if (!isEmpty(this.subgroupsRouteBuilder)) {

            routeHandlers = Object.values(this.subgroupsRouteBuilder)
                .map((subRoute): IGroupeRouteHandlerConventions => {
                    const routeHandler = subRoute.buildRouteHandlers()

                    return {
                        routesHandlersConventions: subRoute.routeHandleBuilder?.buildRouteHandlers(),
                        subGroups: routeHandler.subGroups, // Cette ligne crée les probléme de dupplication !
                        prefix: subRoute.completePrefix,
                        metadataCollection: routeHandler.metadataCollection
                    }
                })
        }

        return {
            routesHandlersConventions,
            subGroups: routeHandlers,
            prefix: this.completePrefix,
            metadataCollection: this.metadataCollection
        }
    }

    buildRouter(): express.Router {
        const router = e.Router()
        const routerHandler = this.routeHandleBuilder?.buildRouter()

        const routers = Object.values(this.subgroupsRouteBuilder)
            .map(subRoute => subRoute.buildRouter()) // J'ai un doute par rapport à cette ligne

        router.use(this.prefix, this.middlewares, routerHandler ?? [], routers)

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

export function instanceOfIRouteHandlerConventions(object: any): object is IRouteHandlerConventions {
    return 'requestHandlerConventions' in object
}

export function instanceOfIGroupeRouteHandlerConventions(object: any): object is IGroupeRouteHandlerConventions {
    return 'subGroups' in object && 'routesHandlersConventions' in object
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

