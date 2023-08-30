import {Container, interfaces} from "inversify";
import express from "express";
import e, {Application, NextFunction, Request, RequestHandler, Response} from "express";
import {RequestHandlerParams} from "express-serve-static-core";

type MiddlewareFunction = (req: Request, res: Response, next: NextFunction) => void;

export type HTTPMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

interface IRouteHandler {
    middlewares: MiddlewareFunction[];
    path: string;
    method: HTTPMethod;
    requestHandler: RequestHandler;
    metadata: any[]
}

class RouteBuilder implements ISingleRouteBuilder {
    protected routeHandlers: IRouteHandler[] = [];
    protected middlewares: MiddlewareFunction[] = [];

    constructor(protected prefix: string) {
    }

    map(path: string, method: HTTPMethod, requestHandler: RequestHandler): ISingleRouteBuilder {
        this.routeHandlers.push({path, method, requestHandler, middlewares: [], metadata: []})
        return this
    }

    withMiddleware(middleware: MiddlewareFunction): ISingleRouteBuilder {
        this.routeHandlers.at(this.routeHandlers.length - 1)?.middlewares.push(middleware)
        return this;
    }

    buildRouters(): IRouteCollection {
        const routers = this.routeHandlers.map(endpoint => {
            const router = express.Router()
            router[endpoint.method](endpoint.path, ...endpoint.middlewares, endpoint.requestHandler);
            return router;
        });

        return {
            routers: [routers],
            middlewares: this.middlewares,
            prefix: this.prefix,
        };
    }
}

interface ISingleRouteBuilder extends IRouteBuilder {
    map: (path: string, methode: HTTPMethod, requestHandler: RequestHandler) => ISingleRouteBuilder
    withMiddleware: (middleware: MiddlewareFunction) => ISingleRouteBuilder
}


interface IGroupedRouteBuilder extends ISingleRouteBuilder {
    withMiddleware: (middleware: MiddlewareFunction) => IGroupedRouteBuilder
}

interface IRouteBuilder {
    buildRouters: () => IRouteCollection
}


class GroupedRouteBuilder extends RouteBuilder implements IGroupedRouteBuilder {

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
    map: (path: string, methode: HTTPMethod, requestHandler: RequestHandler) => ISingleRouteBuilder
    mapGroup: (prefix: string) => IGroupedRouteBuilder;
    dataSources: EndpointDataSource[];
}

type RouteMapBuilderCallBack = (routeMapBuilder: IRouteMapBuilder) => IRouteMapBuilder

interface IApp {
    addMiddleware: (...callbacks: RequestHandlerParams[]) => IApp;
    addEndpoint: (callback: RouteMapBuilderCallBack) => void;
    run: () => void;
}

class EndpointDataSource {
    private routeBuilder!: IRouteBuilder

    constructor() {
        // Il retourne les endpoints (EndpointBuilder)
        // Les endpoints seront utilisés par Swagger pour générer l'auto documentation
    }

    public addRouteBuilder(builder: ISingleRouteBuilder): ISingleRouteBuilder {
        this.routeBuilder = builder
        return builder
    }

    public getRouters(): IRouteCollection {
        return this.routeBuilder.buildRouters()
    }

}

// Pour améliorer la performance, cela serrait intéressant de créer une premiere phase
// de build. Cela permettrait de créer et de mettre en cache les données
// Dans la fonction run, je configure express
export class App implements IApp, IRouteMapBuilder {
    private readonly app: Application = express()
    private static readonly services: interfaces.Container = new Container()
    public dataSources: EndpointDataSource[] = []
    private middlewares: RequestHandlerParams[] = []
    public readonly services: interfaces.Container = App.services

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

    map(path: string, method: HTTPMethod, requestHandler: RequestHandler): ISingleRouteBuilder {
        const singleRouteBuilder = new RouteBuilder('/').map(path, method, requestHandler)
        return this.createAndAddDataSource(singleRouteBuilder);
    }

    mapGroup(prefix: string): IGroupedRouteBuilder {
        const groupedRouteBuilder = new GroupedRouteBuilder(prefix)
        return this.createAndAddDataSource(groupedRouteBuilder)
    }

    private createAndAddDataSource<T extends ISingleRouteBuilder>(
        routeBuilder: T,
    ): ISingleRouteBuilder {
        const dataSource = new EndpointDataSource()
        const length = this.dataSources.push(dataSource);
        return this.dataSources.at(length - 1)!.addRouteBuilder(routeBuilder);
    }
}
