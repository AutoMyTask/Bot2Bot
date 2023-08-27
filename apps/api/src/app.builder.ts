import {Container, interfaces} from "inversify";
import express, {Application, NextFunction, Request, RequestHandler, Response} from "express";
import e from "express";

type MiddlewareFunction = (req: Request, res: Response, next: NextFunction) => void;

type CallbackRequest = (req: Request, res: Response) => void;

export type HTTPMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

interface IEndpointRouteBuilder {
    map: (path: string, methode: HTTPMethod, callback: CallbackRequest) => IEndpointRouteBuilder
    withMiddleware: (middleware: MiddlewareFunction) => IEndpointRouteBuilder
    build: () => e.Router
}

class EndpointRouteBuilder implements IEndpointRouteBuilder {
    private path: string = ''
    private middlewares: MiddlewareFunction[] = []
    private method: HTTPMethod = 'get'
    private callback: CallbackRequest = (req, res) => {}

    build(): e.Router {
        const router = e.Router()
        this.middlewares.forEach(middleware => {
            router.use(middleware)
        })
        router[this.method](this.path, this.callback)
        return router;
    }

    withMiddleware(middleware: MiddlewareFunction): IEndpointRouteBuilder {
        this.middlewares.push(middleware)
        return this;
    }

    map(path: string, method: HTTPMethod, callback: CallbackRequest): IEndpointRouteBuilder {
        this.setCallback(callback)
        this.setMethod(method)
        this.setPath(path)
        return this;
    }

    private setCallback(callback: CallbackRequest): void{
        this.callback = callback
    }

    private setPath(path: string): void {
        this.path = path
    }

    private setMethod(method: HTTPMethod){
        this.method = method
    }

}

type EndpointBuilderCallBack = (endpoint: IEndpointRouteBuilder) => e.Router

interface IApp {
    addMiddleware: (...callbacks: RequestHandler[]) => IApp;
    addEndpoint: (callback: EndpointBuilderCallBack) => void;
    run: () => void;
}

export class App implements IApp {
    private readonly app: Application = express()
    private static readonly services: interfaces.Container = new Container()
    public readonly services: interfaces.Container = App.services

    addMiddleware(...callbacks: RequestHandler[]): IApp {
        this.app.use(...callbacks)
        return this
    }

    public static createBuilder(): IApp {
        return new App()
    }

    addEndpoint(callback: EndpointBuilderCallBack): void {
        const router = callback(new EndpointRouteBuilder())
        this.app.use(router)
    }

    run(): void {
        this.app.listen(process.env.PORT, () => {
            console.log(`Server started on port: http://localhost:${process.env.PORT}/docs`)
        })
    }
}
