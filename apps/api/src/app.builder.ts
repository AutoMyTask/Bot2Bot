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


interface IRequestHandler {
    handler: RequestHandler,
    params: { key: any },
    path: string,
    prefix: string,
    method: HTTPMethod
}


class RequestHandlerBuilder {
    constructor(
        private instance: object,
        private controllerRequest: ControllerRequestHandler,
        private path: string,
        private prefix: string,
        private method: HTTPMethod
    ) {
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
            const result = this.controllerRequest.apply(this.instance, args)
            return res.json(result)
        }
        return {
            params,
            handler,
            path: this.path,
            method: this.method,
            prefix: this.prefix
        }
    }
}


interface IRouteHandler {
    router: e.Router,
    requestHandlers: IRequestHandler[],
    prefix: string,
    metadataCollection: MetadataCollection
}



class RouteHandlerBuilder implements ISingleRouteBuilder, IRouteBuilder{
    private router: e.Router = e.Router()
    private middlewares: MiddlewareFunction[] = []
    private metadataCollection: MetadataCollection = new MetadataCollection()
    private requestHandlerBuilders: RequestHandlerBuilder[] = []

    constructor(
        private prefix: string,
    ) {
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
                this.prefix,
                method
            )
        )
        return this
    }

    withMiddleware(middleware: MiddlewareFunction): ISingleRouteBuilder {
        this.middlewares.push(middleware)
        return this
    }

    build(): IRouteHandler {

        const requestHandlers = this.requestHandlerBuilders.map(requestHandlerBuilder => requestHandlerBuilder.build())
        for (let requestHandler of requestHandlers) {
            this.router[requestHandler.method](requestHandler.path, ...this.middlewares, requestHandler.handler)
        }


        return {
            router: this.router,
            requestHandlers,
            prefix: this.prefix,
            metadataCollection: this.metadataCollection
        }
    }

    extension(callback: CallbackSingleRouteBuilder): ISingleRouteBuilder {
        callback(this)
        return this
    }

    buildRouters(): IRouter {
        const router = this.build().router;
        return {
            router,
            middlewares: [],
            prefix: '/',
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
    buildRouters: () => IRouter
}


// Ne plus étendre ! Choisir le fait qu'il contienne plusieurs router builder
// Utilise router.use(prefix) a chaaqe fois qu'un nouveau groupe se crée.
class GroupedRouteBuilder implements IGroupedRouteBuilder, IRouteBuilder {
    private middlewares: MiddlewareFunction[] = []
    private metadataCollection: MetadataCollection = new MetadataCollection()
    private routeHandleBuilder?: RouteHandlerBuilder

    constructor(protected prefix: string, private routeMapBuilder: IRouteMapBuilder) {
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
        this.routeHandleBuilder = this.routeHandleBuilder ?? new RouteHandlerBuilder(this.prefix)
        this.routeHandleBuilder.addRequestHandler(instance, controllerRequestHandler, path, method)

        const hasRouteBuilder = this.routeMapBuilder.dataSources.some(dataSource => dataSource.routeBuilder === this)
        if (!hasRouteBuilder) {
            const dataSource = new EndpointDataSource(this)
            this.routeMapBuilder.dataSources.push(dataSource);
        }

        return this.routeHandleBuilder;
    }

    buildRouters(): IRouter {
        const routerHandler = this.routeHandleBuilder!.buildRouters().router
        const router = e.Router()
        router.use(this.prefix, routerHandler)
        return {
            router,
            prefix: this.prefix,
            middlewares: this.middlewares
        }
    }

}


interface IRouter {
    router: e.Router;
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

    public getRouters(): IRouter {
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

        //    const routerV1Auth = e.Router()
        //     routerV1Auth.get('/oui', (req, res) => {
        //        return res.json({oui: true})
        //     })

        //    routerV1Auth.get('/non', (req, res) => {
        //        return res.json({oui: false})
        //    })

        //    const routerV1user = e.Router()
        //    routerV1user.get('/oui', (req, res) => {
        //        return res.json({oui: true})
        //    })

        //    routerV1user.get('/non', (req, res) => {
        //        return res.json({oui: false})
        //   })

        //    const routerV1 = e.Router()
        //    routerV1.use('/auth', routerV1Auth)
        //    routerV1.use('/users', routerV1user)

        //    const routerV = e.Router()
        //    routerV.use('/v1', routerV1)

        //    const routerApp = e.Router()
        //    routerApp.get('/non', (req, res) => {
        //        return res.json({oui: false})
        //   })

        //   routerApp.use('/api',routerV)

        //   this.app.use('/app', routerApp)

        for (const dataSource of this.dataSources) {
            const {prefix, middlewares, router} = dataSource.getRouters()
            this.app.use(prefix, ...middlewares, router)
        }

        this.app.listen(process.env.PORT, () => {
            console.log(`Server started on port: http://localhost:${process.env.PORT}/docs`)
        })
    }

    map(path: string, method: HTTPMethod, instance: object, controllerRequest: ControllerRequestHandler): ISingleRouteBuilder {
        const routeHandlerBuilder = new RouteHandlerBuilder('/').addRequestHandler(instance, controllerRequest, path, method )
        this.createAndAddDataSource(routeHandlerBuilder);
        return routeHandlerBuilder
    }

    mapGroup(prefix: string): IGroupedRouteBuilder {
        return new GroupedRouteBuilder(prefix, this)
    }

    private createAndAddDataSource(
        routeBuilder: IRouteBuilder,
    ): void {
        const dataSource = new EndpointDataSource(routeBuilder)
        this.dataSources.push(dataSource);
    }
}

