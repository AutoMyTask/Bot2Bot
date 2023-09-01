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

interface IRouteHandler {
    middlewares: MiddlewareFunction[];
    path: string;
    method: HTTPMethod;
    requestHandler: RequestHandler;
    metadata: MetadataCollection
}


class RequestHandlerMapper {
    static map(instance: object, controllerRequest: ControllerRequestHandler): RequestHandler {
        const params = Reflect.getMetadata('params', instance, controllerRequest.name)
        return (req: Request, res: Response, next: NextFunction) => {
            const args = Array
                .from({ length: controllerRequest.length }, (_, index) => index)
                .reduce((args, index) => {
                    args[index] = req.params[params[index]]
                    return args
                }, [] as any[])
            const result = controllerRequest.apply(instance, args)
            return res.json(result)
        }
    }
}


class RouteBuilder implements ISingleRouteBuilder, IRouteBuilder {
    protected routeHandlers: IRouteHandler[] = [];
    protected middlewares: MiddlewareFunction[] = [];

    constructor(protected prefix: string) {}

    extension(callback: CallbackSingleRouteBuilder): this {
        callback(this)
        return this
    }

    withMiddleware(middleware: MiddlewareFunction): ISingleRouteBuilder {
        this.routeHandlers.at(this.routeHandlers.length - 1)?.middlewares.push(middleware)
        return this;
    }

    addRequestHandler(path: string, method: HTTPMethod, instance: object, controllerRequestHandler: ControllerRequestHandler): RouteBuilder {
        const requestHandler = RequestHandlerMapper.map(instance, controllerRequestHandler)
        this.routeHandlers.push({path, method, requestHandler, middlewares: [], metadata: new MetadataCollection()})
        return this
    }

    buildRouters(): IRouteCollection {
        const routers = this.routeHandlers.map(route => {
            const router = express.Router()
            router[route.method](route.path, ...route.middlewares, route.requestHandler);
            return router;
        });

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
    withMiddleware: (middleware: MiddlewareFunction) => IGroupedRouteBuilder
    extension: (callback: CallbackGroupedRouteBuilder) => IGroupedRouteBuilder
    map: (path: string, method: HTTPMethod, instance: object, controllerRequestHandler: ControllerRequestHandler) => ISingleRouteBuilder,
}

interface IRouteBuilder {
    buildRouters: () => IRouteCollection
}


class GroupedRouteBuilder extends RouteBuilder implements IGroupedRouteBuilder {

    constructor(protected prefix: string, private routeMapBuilder: IRouteMapBuilder) {
        super(prefix)
    }

    withMiddleware(middleware: MiddlewareFunction): IGroupedRouteBuilder {
        this.middlewares.push(middleware);
        return this
    }

    extension(callback: CallbackGroupedRouteBuilder): this {
        callback(this)
        return this
    }

    map(path: string, method: HTTPMethod, instance: object, controllerRequestHandler: ControllerRequestHandler): ISingleRouteBuilder {
        const routeBuilder = this.addRequestHandler(path, method, instance, controllerRequestHandler)
        const dataSource = new EndpointDataSource()
        const length = this.routeMapBuilder.dataSources.push(dataSource);
        return this.routeMapBuilder.dataSources.at(length - 1)!.addRouteBuilder(routeBuilder);
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
    private routeBuilder!: IRouteBuilder

    constructor() {
    }

    public addRouteBuilder(builder: RouteBuilder): RouteBuilder {
        this.routeBuilder = builder
        return builder
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

    map(path: string, method: HTTPMethod, instance: object,  controllerRequest: ControllerRequestHandler): ISingleRouteBuilder {
        const singleRouteBuilder = new RouteBuilder('/').addRequestHandler(path, method,instance, controllerRequest)
        return this.createAndAddDataSource(singleRouteBuilder);
    }

    mapGroup(prefix: string): IGroupedRouteBuilder {
        return new GroupedRouteBuilder(prefix, this)
    }

    private createAndAddDataSource(
        routeBuilder: RouteBuilder,
    ): RouteBuilder {
        const dataSource = new EndpointDataSource()
        const length = this.dataSources.push(dataSource);
        return this.dataSources.at(length - 1)!.addRouteBuilder(routeBuilder);
    }
}

