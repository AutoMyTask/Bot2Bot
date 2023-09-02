import {Container, interfaces} from "inversify";
import express from "express";
import e, {Application, NextFunction, Request, RequestHandler, Response} from "express";
import {RequestHandlerParams} from "express-serve-static-core";


type MiddlewareFunction = (req: Request, res: Response, next: NextFunction) => void;

export type HTTPMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

class MetadataCollection {
    public items: object[] = []

    push(metadata: object) {
        this.items.push(metadata)
    }

    getMetadata<T extends object>(index: number): T {
        return this.items.at(index) as T
    }
}


interface IRequestHandler{
    handler: RequestHandler,
    params: { key: any }

}


class RequestHandlerBuilder {
    constructor(private instance: object, private controllerRequest: ControllerRequestHandler) {
    }

    build(): IRequestHandler {
        const params = Reflect.getMetadata('params', this.instance, this.controllerRequest.name)
        const handler =  (req: Request, res: Response, next: NextFunction) => {
            const args = Array
                .from({length: this.controllerRequest.length}, (_, index) => index)
                .reduce((args, index) => {
                    args[index] = req.params[params[index]]
                    return args
                }, [] as any[])
            const result = this.controllerRequest.apply(this.instance, args)
            return res.json(result)
        }
        return  {
            params,
            handler
        }
    }
}


interface IRouteHandler {
    router: e.Router,
    requestHandler: IRequestHandler,
    path: string,
    method: HTTPMethod,
    prefix: string
}

class RouteHandlerBuilder {
    private middlewares: MiddlewareFunction[] = []

    constructor(
        private requestHandlerBuilder: RequestHandlerBuilder,
        private path: string,
        private method: HTTPMethod,
        private prefix: string
    ) {
    }

    addMiddleware(middleware: MiddlewareFunction){
        this.middlewares.push(middleware)
    }

    build(): IRouteHandler{
        const router = express.Router()
        const requestHandler = this.requestHandlerBuilder.build()
        router[this.method](this.path, ...this.middlewares, requestHandler.handler)
        return {
            router,
            requestHandler,
            path: this.path,
            method: this.method,
            prefix: this.prefix
        }
    }
}

class RouteBuilder implements ISingleRouteBuilder, IRouteBuilder {
    protected routeHandlerBuilders: RouteHandlerBuilder[] = [];
    protected middlewares: MiddlewareFunction[] = [];

    constructor(protected prefix: string) {
    }

    extension(callback: CallbackSingleRouteBuilder): this {
        callback(this)
        return this
    }

    withMiddleware(middleware: MiddlewareFunction): ISingleRouteBuilder {
        this.routeHandlerBuilders.at(this.routeHandlerBuilders.length - 1)?.addMiddleware(middleware)
        return this;
    }

    addRequestHandler(path: string, method: HTTPMethod, instance: object, controllerRequestHandler: ControllerRequestHandler): RouteBuilder {
        const requestHandlerBuilder = new RequestHandlerBuilder(instance, controllerRequestHandler)
        const routeHandlerBuilder = new RouteHandlerBuilder(requestHandlerBuilder, path, method, this.prefix)
        this.routeHandlerBuilders.push(routeHandlerBuilder)
        return this
    }

    buildRouters(): IRouteCollection {
        const routers = this.routeHandlerBuilders.map(builder => builder.build().router);
        return {
            routers: [routers],
            middlewares: this.middlewares,
            prefix: this.prefix,
        };
    }
}

export type CallbackSingleRouteBuilder = (builder: ISingleRouteBuilder) => void


interface ISingleRouteBuilder {
    withMiddleware: (middleware: MiddlewareFunction) => ISingleRouteBuilder
    extension: (callback: CallbackSingleRouteBuilder) => ISingleRouteBuilder
}

export type CallbackGroupedRouteBuilder = (builder: IGroupedRouteBuilder) => void

interface IGroupedRouteBuilder {
    _withMiddleware: (middleware: MiddlewareFunction) => IGroupedRouteBuilder
    _extension: (callback: CallbackGroupedRouteBuilder) => IGroupedRouteBuilder
    map: (path: string, method: HTTPMethod, instance: object, controllerRequestHandler: ControllerRequestHandler) => ISingleRouteBuilder,
}

interface IRouteBuilder {
    buildRouters: () => IRouteCollection
}


class GroupedRouteBuilder extends RouteBuilder implements IGroupedRouteBuilder {

    constructor(protected prefix: string, private routeMapBuilder: IRouteMapBuilder) {
        super(prefix)
    }

    _withMiddleware(middleware: MiddlewareFunction): IGroupedRouteBuilder {
        this.middlewares.push(middleware);
        return this
    }

    _extension(callback: CallbackGroupedRouteBuilder): this {
        callback(this)
        return this
    }

    map(path: string, method: HTTPMethod, instance: object, controllerRequestHandler: ControllerRequestHandler): ISingleRouteBuilder {
        const hasRouteBuilder = this.routeMapBuilder.dataSources.some(dataSource => dataSource.routeBuilder === this)
        this.addRequestHandler(path, method, instance, controllerRequestHandler)

        if (!hasRouteBuilder) {
            const dataSource = new EndpointDataSource(this)
            this.routeMapBuilder.dataSources.push(dataSource);
        }

        return this;
    }

}


interface IRouteCollection {
    routers: e.Router[][];
    middlewares: MiddlewareFunction[];
    prefix: string;
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
    run: () => void;
    configure: (configureServiceCallback: ConfigureServiceCallback) => void
}

class EndpointDataSource {
    constructor(public readonly routeBuilder: IRouteBuilder) {
    }

    public getRouters(): IRouteCollection {
        return this.routeBuilder.buildRouters()
    }

}

type ControllerRequestHandler = (...args: any[]) => any

export class App implements IApp, IRouteMapBuilder {
    private readonly app: Application = express()
    private static readonly services: interfaces.Container = new Container()
    public dataSources: EndpointDataSource[] = []
    private middlewares: RequestHandlerParams[] = []
    public readonly services: interfaces.Container = App.services

    configure(configureServiceCallback: ConfigureServiceCallback): void {
        configureServiceCallback(this.services)
    }

    addMiddleware(...callbacks: RequestHandlerParams[]): IApp {
        this.middlewares = callbacks
        return this
    }

    public static createApp(): IApp {
        return new App()
    }

    addEndpoint(callbackEndpointBuilder: RouteMapBuilderCallBack): void {
        callbackEndpointBuilder(this)
    }

    // Run ne doit pas être présent dans le appBuilder
    run(): void {
        this.app.use(...this.middlewares)
        console.log(this.dataSources.length)
        for (const dataSource of this.dataSources) {
            const {prefix, middlewares, routers} = dataSource.getRouters()
            if (routers.length > 0) {
                this.app.use(prefix, ...middlewares, ...routers)
            }
        }

        this.app.listen(process.env.PORT, () => {
            console.log(`Server started on port: http://localhost:${process.env.PORT}/docs`)
        })
    }

    map(path: string, method: HTTPMethod, instance: object, controllerRequest: ControllerRequestHandler): ISingleRouteBuilder {
        const singleRouteBuilder = new RouteBuilder('/').addRequestHandler(path, method, instance, controllerRequest)
        return this.createAndAddDataSource(singleRouteBuilder);
    }

    mapGroup(prefix: string): IGroupedRouteBuilder {
        return new GroupedRouteBuilder(prefix, this)
    }

    private createAndAddDataSource(
        routeBuilder: RouteBuilder,
    ): RouteBuilder {
        const dataSource = new EndpointDataSource(routeBuilder)
        this.dataSources.push(dataSource);
        return routeBuilder;
    }
}

