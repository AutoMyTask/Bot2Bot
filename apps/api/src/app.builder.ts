import {Container, interfaces} from "inversify";
import express from "express";
import e, {Application, NextFunction, Request, RequestHandler, Response} from "express";

type MiddlewareFunction = (req: Request, res: Response, next: NextFunction) => void;

type CallbackRequest = (req: Request, res: Response) => void;

export type HTTPMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

class RouteHandler {
    public middlewares: MiddlewareFunction[] = []

    constructor(
        public path: string,
        public method: HTTPMethod,
        public callback: CallbackRequest,
    ) {
    }
}


class RouteGroupBuilder {
    private routeHandlers: RouteHandler[] = []
    private currentRouteHandler: RouteHandler | null = null;

    add(path: string, method: HTTPMethod, callback: CallbackRequest): void {
        const routeHandler = new RouteHandler(path, method, callback)
        this.routeHandlers.push(routeHandler)
        this.currentRouteHandler = routeHandler
    }

    addMiddleware(middleware: MiddlewareFunction): void {
        if (this.routeHandlers.length > 0) {
            this.routeHandlers[this.routeHandlers.length - 1].middlewares.push(middleware)
        }
    }

    build(): e.Router {
        const router = e.Router()
        this.routeHandlers.forEach(endpoint => {
            router[endpoint.method](endpoint.path, ...endpoint.middlewares, endpoint.callback)
        })
        return router;
    }
}

interface ISingleRouteBuilder {
    map: (path: string, methode: HTTPMethod, callback: CallbackRequest) => ISingleRouteBuilder
    withMiddleware: (middleware: MiddlewareFunction) => ISingleRouteBuilder
    build: () => IRouteCollection
}


interface IGroupedRouteBuilder extends ISingleRouteBuilder {
    withMiddleware: (middleware: MiddlewareFunction) => IGroupedRouteBuilder
}

class GroupedRouteBuilder implements IGroupedRouteBuilder {
    private middlewares: MiddlewareFunction[] = []

    private routes: ISingleRouteBuilder[] = []

    constructor(
        private routeMapBuilder: IRouteMapBuilder ,
        private prefix: string) {
    }

    map(path: string, method: HTTPMethod, callback: CallbackRequest): ISingleRouteBuilder {
        const routeBuilder = new SingleRouteBuilder().map(path, method, callback)
        this.routes.push(routeBuilder)
        return routeBuilder;
    }

    withMiddleware(middleware: MiddlewareFunction): IGroupedRouteBuilder {
        this.middlewares.push(middleware);
        return this
    }

    build(): IRouteCollection {
        const routers = this.routes
            .map(routeBuilder => routeBuilder.build().routers).flat()

        return new RouteCollection(routers, this.middlewares, this.prefix);
    }
}


interface IRouteCollection {
    routers: e.Router[][];
    middlewares: MiddlewareFunction[];
    prefix: string;
}

class RouteCollection implements IRouteCollection {
    constructor(
        public routers: e.Router[][],
        public middlewares: MiddlewareFunction[] = [],
        public prefix: string = '/') {}
}

// Créé un endpoint
class SingleRouteBuilder implements ISingleRouteBuilder {

    private routeGroupBuilder: RouteGroupBuilder = new RouteGroupBuilder()

    build(): IRouteCollection {
        const router = this.routeGroupBuilder.build()
        return new RouteCollection([[router]]);
    }

    withMiddleware(middleware: MiddlewareFunction): ISingleRouteBuilder {
        this.routeGroupBuilder.addMiddleware(middleware)
        return this;
    }

    map(path: string, method: HTTPMethod, callback: CallbackRequest): ISingleRouteBuilder {
        this.routeGroupBuilder.add(path, method, callback)
        return this;
    }
}


interface IRouteMapBuilder {
    map: (path: string, methode: HTTPMethod, callback: CallbackRequest) => ISingleRouteBuilder
    mapGroup: (prefix: string) => IGroupedRouteBuilder
}

type EndpointBuilderCallBack = (routeMapBuilder: IRouteMapBuilder) => IRouteCollection

interface IApp {
    addMiddleware: (...callbacks: RequestHandler[]) => IApp;
    addEndpoint: (callback: EndpointBuilderCallBack) => void;
    run: () => void;
    dataSources: DataSourceEndpoint[]
}

class DataSourceEndpoint {

}

export class App implements IApp, IRouteMapBuilder {
    private readonly app: Application = express()
    private static readonly services: interfaces.Container = new Container()
    public dataSources: DataSourceEndpoint[] = []
    public readonly services: interfaces.Container = App.services

    addMiddleware(...callbacks: RequestHandler[]): IApp {
        this.app.use(...callbacks)
        return this
    }

    public static createBuilder(): IApp {
        return new App()
    }

    addEndpoint(callback: EndpointBuilderCallBack): void {
        const {prefix, middlewares, routers} = callback(this)
        if (routers.length > 0) {
            this.app.use(prefix, ...middlewares, ...routers)
        }
    }

    run(): void {
        this.app.listen(process.env.PORT, () => {
            console.log(`Server started on port: http://localhost:${process.env.PORT}/docs`)
        })
    }

    map(path: string, method: HTTPMethod, callback: CallbackRequest): ISingleRouteBuilder {
        return new SingleRouteBuilder().map(path, method, callback);
    }

    mapGroup(prefix: string): IGroupedRouteBuilder {
        return new GroupedRouteBuilder(this, prefix)
    }

}
