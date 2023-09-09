import {Container, interfaces} from "inversify";
import express from "express";
import e, {Application, NextFunction, Request, RequestHandler, Response} from "express";
import {RequestHandlerParams} from "express-serve-static-core";
import {isEmpty} from "radash";

export type HTTPMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'
type Constructor = new (...args: any[]) => {};


export function Body(requestType: Constructor) {
    return (
        target: Constructor,
        methodName: string,
        parameterIndex: number
    ) => {
        const metadata = {
            [parameterIndex]: {
                request: new requestType()
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

    push(metadata: object) {
        this.items.push(metadata)
    }

    getMetadata<T extends object>(index: number): T {
        return this.items.at(index) as T
    }
}


interface IRequestHandler {
    handler: RequestHandler,
    middlewares: RequestHandler[]
}


export interface IRequestHandlerConventions {
    params: {
        path: string[]
    },
    path: string,
    method: HTTPMethod,
    fullPath: string
}

type ParamsHandler = { [key: string]: string }

class RequestHandlerBuilder {
    private middlewares: RequestHandler[] = []
    private readonly paramsHandler?: ParamsHandler
    public readonly requestHandlerConvention: IRequestHandlerConventions;

    constructor(
        private readonly controllerType: Constructor,
        private readonly controllerMethod: ControllerMethod,
        private readonly path: string,
        private readonly method: HTTPMethod,
        private readonly prefix: string = ''
    ) {
        this.paramsHandler = Reflect.getMetadata('params', this.controllerType, this.controllerMethod.name)

        this.requestHandlerConvention = {
            params: {
                path: this.paramsHandler ? Object.values(this.paramsHandler) : []
            },
            method,
            path,
            fullPath: this.prefix + this.path
        }
    }

    addMiddleware(middleware: RequestHandler) {
        this.middlewares.push(middleware)
    }

    build(): IRequestHandler {
        const body = Reflect.getMetadata('body', this.controllerType, this.controllerMethod.name)
        const handler = async (req: Request, res: Response, next: NextFunction) => {

            const args = Array
                .from({length: this.controllerMethod.length}, (_, index) => index)
                .reduce((args, index) => {
                    if (this.paramsHandler) {
                        args[index] = req.params[this.paramsHandler[index]]
                    }
                    if (!isEmpty(req.body) && !isEmpty(body[index])) {
                        args[index] = req['body']
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
    metadataCollection: MetadataCollection
}

export interface IGroupeRouteHandlerConventions {
    routesHandlersConventions?: IRouteHandlerConventions,
    subGroups: IGroupeRouteHandlerConventions[],
    prefix: string
}


class RouteHandlerBuilder implements ISingleRouteBuilder, IRouteBuilder {
    private metadataCollection: MetadataCollection = new MetadataCollection()
    private requestHandlerBuilders: RequestHandlerBuilder[] = []

    constructor(private readonly prefix: string = '') {
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
                this.prefix
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

        return {
            requestHandlerConventions,
            metadataCollection: this.metadataCollection
        }

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
}


interface ISingleRouteBuilder {
    withMiddleware: (middleware: RequestHandler) => ISingleRouteBuilder
}

interface IGroupedRouteBuilder {
    withMiddleware: (middleware: RequestHandler) => IGroupedRouteBuilder
    map: (path: string, method: HTTPMethod, controllerType: Constructor, controllerMethod: ControllerMethod) => ISingleRouteBuilder,
    mapGroup: (prefix: string) => IGroupedRouteBuilder
}

class GroupedRouteBuilder implements IGroupedRouteBuilder, IRouteMapBuilder, IRouteBuilder {
    public services: interfaces.Container
    public dataSources: EndpointDataSource[] = []
    private middlewares: RequestHandler[] = []
    private metadataCollection: MetadataCollection = new MetadataCollection()
    private routeHandleBuilder?: RouteHandlerBuilder
    private subgroupsRouteBuilder: { [key: string]: GroupedRouteBuilder } = {}

    constructor(
        private prefix: string,
        private routeMapBuilder: IRouteMapBuilder,
        private completePrefix: string = prefix
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
        this.routeHandleBuilder = this.routeHandleBuilder ?? new RouteHandlerBuilder(this.completePrefix)
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
        const groupedBuilder = new GroupedRouteBuilder(prefix, this, this.completePrefix + prefix)
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
                    if (!subRoute.subgroupsRouteBuilder) {
                        return {
                            routesHandlersConventions: undefined,
                            subGroups: [],
                            prefix: ''
                        }
                    }

                    const subGroupHandlers = subRoute.buildRouteHandlers().subGroups

                    return {
                        routesHandlersConventions: subRoute.routeHandleBuilder?.buildRouteHandlers(),
                        subGroups: subGroupHandlers, // Cette ligne crée les probléme de dupplication !
                        prefix: subRoute.completePrefix
                    }
                })
        }


        return {
            routesHandlersConventions,
            subGroups: routeHandlers,
            prefix: this.completePrefix
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

type ConfigureServiceCallback = (services: interfaces.Container) => void
type ConfigureAppEndpointCallback = (services: interfaces.Container) => IAppEndpoint

interface IApp {
    addMiddleware: (...callbacks: RequestHandlerParams[]) => IApp;
    addEndpoint: (callback: RouteMapBuilderCallBack) => IRouteMapBuilder;
    addAppEndpoint: (routeAppHandler: IAppEndpoint |  ConfigureAppEndpointCallback ) => IApp
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
        let handler = undefined

        if (typeof routeAppHandler === 'function'){
            handler = routeAppHandler(this.services) as IAppEndpoint
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

