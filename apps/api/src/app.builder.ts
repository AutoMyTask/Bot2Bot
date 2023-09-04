import {Container, interfaces} from "inversify";
import express from "express";
import e, {Application, NextFunction, Request, RequestHandler, Response} from "express";
import {RequestHandlerParams} from "express-serve-static-core";

type MiddlewareFunction = (req: Request, res: Response, next: NextFunction) => void;
export type HTTPMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

function Params(paramName: string) {
    return (target: any, propertyKey: string, parameterIndex: number) => {
        const existingMetadata = Reflect.getMetadata('params', target, propertyKey) || {}
        const updateMetadata = {...existingMetadata, [parameterIndex]: paramName}
        Reflect.defineMetadata('params', updateMetadata, target, propertyKey);
    }
}

export default Params

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
    params: { key: any },
    path: string,
    method: HTTPMethod,
    middlewares: MiddlewareFunction[]
}


class RequestHandlerBuilder {
    private middlewares: MiddlewareFunction[] = []

    constructor(
        private instance: object,
        private controllerRequest: ControllerRequestHandler,
        private path: string,
        private method: HTTPMethod
    ) {
    }

    addMiddleware(middleware: MiddlewareFunction) {
        this.middlewares.push(middleware)
    }

    build(): IRequestHandler {
        const params = Reflect.getMetadata('params', this.instance, this.controllerRequest.name)
        const handler = (req: Request, res: Response, next: NextFunction) => {
            const args = Array
                .from({length: this.controllerRequest.length}, (_, index) => index)
                .reduce((args, index) => {
                    args[index] = req.params[params[index]]
                    return args
                }, [] as any[])

            try {
                const result = this.controllerRequest.apply(this.instance, args)
                return res.json(result)
            } catch (err: any) {
                next(err)
            }
        }
        return {
            params,
            handler,
            path: this.path,
            method: this.method,
            middlewares: this.middlewares
        }
    }
}

interface IRouteBuilder {
    buildRouter: () => express.Router
}

interface IRouteHandler {
    router: e.Router,
    requestHandlers: IRequestHandler[],
    metadataCollection: MetadataCollection
}


class RouteHandlerBuilder implements ISingleRouteBuilder, IRouteBuilder {
    private metadataCollection: MetadataCollection = new MetadataCollection()
    private requestHandlerBuilders: RequestHandlerBuilder[] = []

    constructor() {
    }

    addRequestHandler(
        instance: object,
        controllerRequest: ControllerRequestHandler,
        path: string,
        method: HTTPMethod,
    ): RouteHandlerBuilder {
        this.requestHandlerBuilders.push(
            new RequestHandlerBuilder(
                instance,
                controllerRequest,
                path,
                method
            )
        )
        return this
    }

    withMiddleware(middleware: MiddlewareFunction): ISingleRouteBuilder {
        this.requestHandlerBuilders.at(this.requestHandlerBuilders.length - 1)!.addMiddleware(middleware)
        return this
    }

    build(): IRouteHandler {
        const router = e.Router()

        const requestHandlers = this.requestHandlerBuilders.map(requestHandlerBuilder => requestHandlerBuilder.build())
        for (let requestHandler of requestHandlers) {
            router[requestHandler.method](requestHandler.path, ...requestHandler.middlewares, requestHandler.handler)
        }

        return {
            router,
            requestHandlers,
            metadataCollection: this.metadataCollection
        }
    }

    buildRouter(): e.Router {
        return this.build().router
    }
}


interface ISingleRouteBuilder {
    withMiddleware: (middleware: MiddlewareFunction) => ISingleRouteBuilder
}

interface IGroupedRouteBuilder {
    withMiddleware: (middleware: MiddlewareFunction) => IGroupedRouteBuilder
    map: (path: string, method: HTTPMethod, instance: object, controllerRequestHandler: ControllerRequestHandler) => ISingleRouteBuilder,
    mapGroup: (prefix: string) => IGroupedRouteBuilder
}

class GroupedRouteBuilder implements IGroupedRouteBuilder, IRouteMapBuilder, IRouteBuilder {
    public services: interfaces.Container
    public dataSources: EndpointDataSource[] = []
    private middlewares: MiddlewareFunction[] = []
    private metadataCollection: MetadataCollection = new MetadataCollection()
    private routeHandleBuilder?: RouteHandlerBuilder
    private subgroupsRouteBuilder: { [key: string]: GroupedRouteBuilder } = {}

    constructor(private prefix: string, private routeMapBuilder: IRouteMapBuilder) {
        this.services = routeMapBuilder.services
    }

    withMiddleware(middleware: MiddlewareFunction): IGroupedRouteBuilder {
        this.middlewares.push(middleware);
        return this
    }

    map(path: string, method: HTTPMethod, instance: object, controllerRequestHandler: ControllerRequestHandler): ISingleRouteBuilder {
        this.routeHandleBuilder = this.routeHandleBuilder ?? new RouteHandlerBuilder()
        this.routeHandleBuilder.addRequestHandler(instance, controllerRequestHandler, path, method)
        return this.routeHandleBuilder;
    }

    mapGroup(prefix: string): IGroupedRouteBuilder {
        const groupedBuilder = new GroupedRouteBuilder(prefix, this)
        this.subgroupsRouteBuilder = {
            ...this.subgroupsRouteBuilder,
            [prefix]: groupedBuilder
        }
        return groupedBuilder
    }

    buildRouter(): express.Router {
        const router = e.Router()
        const routerHandler = this.routeHandleBuilder?.buildRouter()

        const routers = Object.values(this.subgroupsRouteBuilder).map(subRoute => {
            return subRoute.buildRouter()
        })

        router.use(this.prefix, this.middlewares, routerHandler ?? [], routers)
        return router
    }

}


interface IRouteMapBuilder {
    services: interfaces.Container;
    map: (path: string, methode: HTTPMethod, instance: object, requestHandler: ControllerRequestHandler) => ISingleRouteBuilder
    mapGroup: (prefix: string) => IGroupedRouteBuilder;
    dataSources: EndpointDataSource[];
}

type RouteMapBuilderCallBack = (routeMapBuilder: IRouteMapBuilder) => IRouteMapBuilder

type ConfigureServiceCallback = (services: interfaces.Container) => void

interface IApp {
    addMiddleware: (...callbacks: RequestHandlerParams[]) => IApp;
    addEndpoint: (callback: RouteMapBuilderCallBack) => void;
    addAppEndpoint: (routeAppHandler: IAppEndpoint) => IApp
    run: () => void;
    configure: (configureServiceCallback: ConfigureServiceCallback) => void;
    mapEndpoints: () => void
}

export interface IAppEndpoint {
    route: string,
    handlers: RequestHandlerParams[]
}

class EndpointDataSource {
    constructor(public readonly routeBuilder: IRouteBuilder) {
    }

    public getRouters(): express.Router {
        return this.routeBuilder.buildRouter()
    }

}

type ControllerRequestHandler = (...args: any[]) => any

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

    addEndpoint(callbackEndpointBuilder: RouteMapBuilderCallBack): void {
        callbackEndpointBuilder(this)
    }

    addAppEndpoint(routeAppHandler: IAppEndpoint): IApp {
        this.app.use(routeAppHandler.route, ...routeAppHandler.handlers)
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

    map(path: string, method: HTTPMethod, instance: object, controllerRequest: ControllerRequestHandler): ISingleRouteBuilder {
        const routeHandlerBuilder = new RouteHandlerBuilder().addRequestHandler(instance, controllerRequest, path, method)
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
}

