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
        public callbackRequest: CallbackRequest,
    ) {
    }
}

// Mécanisme qui me permettrait de refractorer mon code avec un extend (a voir)
class RouteBuilder implements ISingleRouteBuilder {
    protected routeHandlers: RouteHandler[] = [];
    protected currentRouteHandler: RouteHandler | null = null;
    protected middlewares: MiddlewareFunction[] = [];

    constructor(protected prefix: string) {}

    map(path: string, method: HTTPMethod, callbackRequest: CallbackRequest): ISingleRouteBuilder{
        const routeHandler = new RouteHandler(path, method, callbackRequest);
        this.routeHandlers.push(routeHandler);
        this.currentRouteHandler = routeHandler;
        return this
    }

    withMiddleware(middleware: MiddlewareFunction): ISingleRouteBuilder {
        this.middlewares.push(middleware);
        return this;
    }

    build(): IRouteCollection {
        const routers = this.routeHandlers.map(endpoint => {
            const router = express.Router();
            router[endpoint.method](endpoint.path, ...endpoint.middlewares, endpoint.callbackRequest);
            return router;
        });

        return {
            routers: [routers],
            middlewares: this.middlewares,
            prefix: this.prefix,
        };
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

interface IRouteBuilder {
    build: () => IRouteCollection
}


class GroupedRouteBuilder extends RouteBuilder implements IGroupedRouteBuilder, IRouteBuilder {

    constructor(protected prefix: string) {
        super(prefix)
    }

    withMiddleware(middleware: MiddlewareFunction): IGroupedRouteBuilder {
        this.middlewares.push(middleware);
        return this
    }
}


interface IRouteCollection {
    routers: e.Router[][];
    middlewares: MiddlewareFunction[];
    prefix: string;
}


interface IRouteMapBuilder {
    map: (path: string, methode: HTTPMethod, callback: CallbackRequest) => ISingleRouteBuilder
    mapGroup: (prefix: string) => IGroupedRouteBuilder;
    dataSources: EndpointDataSource[];
}

type RouteMapBuilderCallBack = (routeMapBuilder: IRouteMapBuilder) => IRouteMapBuilder

interface IApp {
    addMiddleware: (...callbacks: RequestHandler[]) => IApp;
    addEndpoint: (callback: RouteMapBuilderCallBack) => void;
    build: () => void
    run: () => void;
}

// Je devrais gérer ici tout le processus de construction des routes
class EndpointDataSource {
    private routeBuilder!: IRouteBuilder

    constructor() {
        // Il retourne les endpoints (EndpointBuilder)
        // Les endpoints seront utilisés par Swagger pour générer l'auto documentation
        // this.routeBuilder = new SingleRouteBuilder().map(path, method, callbackRequest)
    }

    public addRouteBuilder(builder: ISingleRouteBuilder): ISingleRouteBuilder {
        this.routeBuilder = builder
        return builder
    }

    public getRouters(): IRouteCollection {
        return this.routeBuilder.build()
    }

}

export class App implements IApp, IRouteMapBuilder {
    private readonly app: Application = express()
    private static readonly services: interfaces.Container = new Container()
    public dataSources: EndpointDataSource[] = []

    public readonly services: interfaces.Container = App.services

    addMiddleware(...callbacks: RequestHandler[]): IApp {
        this.app.use(...callbacks)
        return this
    }

    public static createBuilder(): IApp {
        return new App()
    }

    addEndpoint(callbackEndpointBuilder: RouteMapBuilderCallBack): void {
        callbackEndpointBuilder(this)
    }

    // Run ne doit pas être présent dans le appBuilder
    run(): void {
        this.app.listen(process.env.PORT, () => {
            console.log(`Server started on port: http://localhost:${process.env.PORT}/docs`)
        })
    }

    map(path: string, method: HTTPMethod, callbackRequest: CallbackRequest): ISingleRouteBuilder {
        const singleRouteBuilder = new RouteBuilder('/').map(path, method, callbackRequest)
        return this.createAndAddDataSource(singleRouteBuilder);
    }

    mapGroup(prefix: string): IGroupedRouteBuilder {
        const groupedRouteBuilder = new GroupedRouteBuilder(prefix)
        return this.createAndAddDataSource(groupedRouteBuilder)
    }

    build(): void {
        for (const dataSource of this.dataSources) {
            const {prefix, middlewares, routers} = dataSource.getRouters()
            if (routers.length > 0) {
                this.app.use(prefix, ...middlewares, ...routers)
            }
        }
    }

    private createAndAddDataSource<T extends ISingleRouteBuilder>(
        routeBuilder: T,
    ): ISingleRouteBuilder {
        const dataSource = new EndpointDataSource()
        const length = this.dataSources.push(dataSource);
        return this.dataSources[length - 1]!.addRouteBuilder(routeBuilder);
    }

}
