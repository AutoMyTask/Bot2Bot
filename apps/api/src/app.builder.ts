import {Container, inject, injectable, interfaces} from "inversify";
import express from "express";
import e, {Application, NextFunction, Request, RequestHandler, Response} from "express";
import {RequestHandlerParams} from "express-serve-static-core";
import _, {isNull, values} from 'lodash'
import {plainToInstance} from "class-transformer";
import {validateSync} from "class-validator";
import {BadRequestObject} from "./http/errors/BadRequest";


type Constructor = new (...args: any[]) => {};

// PARAMS
type ParamServiceType = Constructor | string
type ParamPathType = string | number | 'int' | 'float'
type ParamType = Constructor | ParamPathType | ParamServiceType


type Param<T extends ParamType> = { name: string, type: T, required?: boolean }
type ParamsHandler<T extends ParamType> = Record<number, Param<T>>


// HTTP
export type HTTPMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'


abstract class ParamsDecorator<T extends ParamType> {
    public metadata: ParamsHandler<T>

    // A typer
    protected readonly types: any[]

    protected constructor(
        protected readonly metadataKey: 'params.body' | 'params.services' | 'params.path',
        protected readonly target: Object,
        protected readonly methodName: string | symbol
    ) {
        this.metadata = Reflect.getMetadata(this.metadataKey, target, methodName) ?? {}
        this.types = Reflect.getMetadata('design:paramtypes', target, methodName)
    }

    add(index: number, option?: { required?: boolean, type?: T, name?: string }) {
        const type = option?.type ?? this.types[index]
        const name = option?.name ?? type?.name
        this.metadata[index] = {type, name, required: option?.required}
        Reflect.defineMetadata(this.metadataKey, this.metadata, this.target, this.methodName)
    }

    get values(): Param<T>[] {
        return values(this.metadata)
    }

    getParam(index: number): Param<T> {
        return this.metadata[index]
    }
}


class ParamsBodyDecorator extends ParamsDecorator<Constructor> {

    constructor(
        protected readonly target: Object,
        protected readonly methodName: string
    ) {
        super('params.body', target, methodName);
    }

    override add(index: number): void {
        if (values(this.metadata).length >= 1) {
            throw new Error('Only one @Body() decorator is allowed in the method.')
        }
        super.add(index);
    }
}


export function Body(
    target: Object,
    methodName: string,
    parameterIndex: number
): void {
    const bodyDecorator = new ParamsBodyDecorator(target, methodName)
    bodyDecorator.add(parameterIndex)
}


class ParamsServiceDecorator extends ParamsDecorator<ParamServiceType> {
    constructor(
        protected readonly target: Object,
        protected readonly methodName: string | symbol
    ) {
        super('params.services', target, methodName);
    }

    override add(index: number, option?: { type?: string }) {
        super.add(index, option);
    }
}

export function Service(type?: string) {
    return (
        target: Object,
        methodName: string | symbol,
        parameterIndex: number
    ) => {
        const paramsServiceHandler: ParamsServiceDecorator = new ParamsServiceDecorator(
            target,
            methodName
        )

        paramsServiceHandler.add(parameterIndex, {type})
    }
}

class ParamsPathDecorator extends ParamsDecorator<ParamPathType> {
    constructor(
        protected readonly target: Object,
        protected readonly methodName: string | symbol
    ) {
        super('params.path', target, methodName);
    }

    add(index: number, option: { name: string, type?: 'int' | 'float' }): void {
        const type = this.types[index]

        if (type !== Number && type !== String) {
            throw new Error(`Invalid parameter type for '${option.name}' in method '${this.methodName as string}'. The parameter should be a Number or a String, but a ${type.name} was provided.`)
        }

        if (type === String && (option?.type === 'int' || option?.type === 'float')) {
            throw new Error(`Invalid parameter type for '${option.name}' in method '${this.methodName as string}'. The parameter should be a Number, but a ${type.name} was provided. 'int' or 'float' can only be associated with a 'Number' type for this specific parameter.`);
        }

        super.add(index, option);
    }
}


export function Params(
    paramName: string,
    type?: 'int' | 'float'
) {
    return (
        target: Object,
        methodName: string,
        parameterIndex: number
    ) => {
        const paramsPath = new ParamsPathDecorator(target, methodName)
        paramsPath.add(parameterIndex, {name: paramName, type})
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

export interface IRequestHandlerConventions {
    params: {
        path: Param<ParamPathType>[]
    },
    body?: Constructor,
    path: string,
    method: HTTPMethod,
    fullPath: string,
    auth?: {
        schemes?: string[]
    },
    metadataCollection: MetadataCollection
}


function parseNumber(input: string): number | null {
    const floatValue: number = parseFloat(input);
    if (!isNaN(floatValue)) {
        return floatValue;
    }

    const intValue: number = parseInt(input, 10);
    if (!isNaN(intValue)) {
        return intValue;
    }

    return null
}


type ArgHandler = InstanceType<Constructor> | number | string

class RequestHandlerBuilder {
    public readonly paramsPath: ParamsPathDecorator;
    public readonly paramBody: ParamsBodyDecorator;
    public readonly paramsService: ParamsServiceDecorator;

    constructor(
        private readonly controllerType: Constructor,
        private readonly controllerMethod: ControllerMethod,
        private readonly services: interfaces.Container
    ) {
        this.paramsPath = new ParamsPathDecorator(controllerType, controllerMethod.name);
        this.paramBody = new ParamsBodyDecorator(controllerType, controllerMethod.name);
        this.paramsService = new ParamsServiceDecorator(controllerType, controllerMethod.name);
    }

    public build(): RequestHandler {
        return async (req: Request, res: Response, next: NextFunction) => {
            try {
                const args = this.buildArgs(req)

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
    }

    private buildArgs(req: Request): ArgHandler[] {
        return Array
            .from({length: this.controllerMethod.length}, (_, index) => index)
            .reduce((args, index) => {
                const requestBodyParameter = this.paramBody.getParam(index)
                const requestServiceParameter = this.paramsService.getParam(index)
                const requestPathParameter = this.paramsPath.getParam(index)

                if (!_.isEmpty(requestServiceParameter)) {
                    args[index] = this.services.get(requestServiceParameter.type)
                }

                if (!_.isEmpty(requestBodyParameter)) {
                    const body = plainToInstance(requestBodyParameter.type, req.body)
                    const errors = validateSync(body)

                    if (errors.length > 0) {
                        throw new BadRequestObject(
                            `The provided fields are incorrect`,
                            errors
                        )
                    }
                    args[index] = body
                    return args
                }

                if (!_.isEmpty(requestPathParameter)) {
                    if (requestPathParameter.type === 'float') {
                        if (!/^\d+(\.\d+)?$/.test(req.params[requestPathParameter.name])) {
                            throw new BadRequestObject(
                                `The '${requestPathParameter.name}' parameter should be a number, but a ${
                                    typeof req.params[requestPathParameter.name]
                                } was provided.`,
                                ['Invalid parameter']
                            )
                        }
                        args[index] = Number.parseFloat(req.params[requestPathParameter.name])
                        return args
                    }

                    if (requestPathParameter.type === 'int') {
                        if (!/^\d+$/.test(req.params[requestPathParameter.name])) {
                            throw new BadRequestObject(
                                `The '${requestPathParameter.name}' parameter should be a number, but a ${
                                    typeof req.params[requestPathParameter.name]
                                } was provided.`,
                                ['Invalid parameter']
                            )
                        }
                        args[index] = Number.parseInt(req.params[requestPathParameter.name])
                        return args
                    }

                    if (typeof requestPathParameter.type === 'function' && requestPathParameter.type === Number) {
                        const pathParam = parseNumber(req.params[requestPathParameter.name])
                        if (isNull(pathParam)) {
                            throw new BadRequestObject(
                                `The '${requestPathParameter.name}' parameter should be a number, but a ${
                                    typeof req.params[requestPathParameter.name]
                                } was provided.`,
                                ['Invalid parameter']
                            )
                        }
                        args[index] = pathParam
                        return args
                    }

                    args[index] = req.params[requestPathParameter.name]
                    return args
                }

                return args
            }, [] as ArgHandler[])
    }
}


abstract class BaseRouteBuilder {
    protected middlewares: RequestHandler[] = []

    protected constructor(
        protected metadataCollection: MetadataCollection
    ) {
    }

    withMiddleware(middleware: RequestHandler): this {
        this.middlewares.push(middleware)
        return this
    }

    withMetadata(metadata: object): this {
        this.metadataCollection.push(metadata)
        return this;
    }


    abstract buildRouter(): express.Router

    abstract buildRouteHandlers(): IRequestHandlerConventions[]
}


type SecurityType = 'bearer' | 'oauth2'

@injectable()
class AuthentificationBuilder {
    constructor(
        @inject('HandlerAuthentification') public readonly handler: RequestHandler,
        @inject('Schemes') public readonly schemes: SecurityType[],
    ) {
    }
}

class SingleRouteBuilder extends BaseRouteBuilder implements ISingleRouteBuilder {
    public readonly requestHandlerConvention: IRequestHandlerConventions

    constructor(
        private requestHandlerBuilder: RequestHandlerBuilder,
        private path: string,
        private method: HTTPMethod,
        private readonly prefix: string = '',
        protected metadataCollection: MetadataCollection,
        private readonly authentificationBuilder?: AuthentificationBuilder,
        private isAuth = !!authentificationBuilder
    ) {
        super(metadataCollection);

        if (!/^\/([^/]+(\/[^/]+)*|[^/]+)$/.test(path)) {
            throw new Error(`Invalid route format for '${path}'. Please use '/{string}/...' format.`)
        }
        const body = this.requestHandlerBuilder.paramBody.values.at(0)?.type

        this.requestHandlerConvention = {
            params: {
                path: this.requestHandlerBuilder.paramsPath.values
            },
            method,
            path,
            fullPath: this.prefix + this.path,
            body,
            metadataCollection: this.metadataCollection
        }
    }

    allowAnonymous(): ISingleRouteBuilder {
        if (!this.authentificationBuilder) {
            // Trouver un meilleur message
            throw new Error("Tu ne peux pas utiliser cette fonctionnalité tant que tu n'as pas config l'auth")
        }
        this.isAuth = false
        return this
    }

    buildRouteHandlers(): IRequestHandlerConventions[] {
        if (this.authentificationBuilder && this.isAuth) {
            this.requestHandlerConvention.auth = {
                schemes: this.authentificationBuilder.schemes
            }
        }
        return [this.requestHandlerConvention]
    }


    buildRouter(): e.Router {
        const router = e.Router()

        if (this.authentificationBuilder && this.isAuth) {
            this.withMiddleware(this.authentificationBuilder.handler)
        }

        router[this.requestHandlerConvention.method](
            this.requestHandlerConvention.path,
            ...this.middlewares,
            this.requestHandlerBuilder.build()
        )

        return router
    }
}


interface ISingleRouteBuilder {
    allowAnonymous: () => ISingleRouteBuilder,
    withMetadata: (metadata: object) => ISingleRouteBuilder
    withMiddleware: (middleware: RequestHandler) => ISingleRouteBuilder
}

interface IGroupedRouteBuilder {
    withMetadata: (metadata: object) => IGroupedRouteBuilder,
    withMiddleware: (middleware: RequestHandler) => IGroupedRouteBuilder
    map: (path: string, method: HTTPMethod, controllerType: Constructor, controllerMethod: ControllerMethod) => ISingleRouteBuilder,
    mapGroup: (prefix: string) => IGroupedRouteBuilder,
    allowAnonymous: () => IGroupedRouteBuilder
}


class GroupedRouteBuilder extends BaseRouteBuilder implements IGroupedRouteBuilder, IRouteMapBuilder {
    public services: interfaces.Container
    public baseRouteBuilders: BaseRouteBuilder[] = []
    private singleRoutesBuilders: SingleRouteBuilder[] = []
    private subgroupsRouteBuilder: GroupedRouteBuilder[] = []
    private isAuth?: boolean = undefined

    constructor(
        private prefix: string,
        private routeMapBuilder: IRouteMapBuilder,
        private completePrefix: string = prefix,
        protected metadataCollection: MetadataCollection = new MetadataCollection()
    ) {
        super(metadataCollection);

        if (!/^\/([^/]+(\/[^/]+)*|[^/]+)$/.test(prefix)) {
            throw new Error(`Invalid prefix format for '${prefix}'. Please use '/{string}/...' format.`)
        }

        this.services = routeMapBuilder.services
    }


    allowAnonymous(): IGroupedRouteBuilder {
        // Idem throw si AuthentificationBuilder est undefenid
        this.isAuth = false
        return this
    }

    map(
        path: string,
        method: HTTPMethod,
        controllerType: Constructor,
        controllerMethod: ControllerMethod
    ): ISingleRouteBuilder {

        let authentificationBuilder: AuthentificationBuilder | undefined
        if (this.services.isBound(AuthentificationBuilder)) {
            authentificationBuilder = this.services.get(AuthentificationBuilder)
        }

        const singleRouteBuilder = new SingleRouteBuilder(
            new RequestHandlerBuilder(controllerType, controllerMethod, this.services),
            path,
            method,
            this.completePrefix,
            _.cloneDeep(this.metadataCollection),
            authentificationBuilder,
            this.isAuth
        )

        this.singleRoutesBuilders.push(singleRouteBuilder)

        return singleRouteBuilder;
    }

    mapGroup(
        prefix: string
    ): IGroupedRouteBuilder {

        const groupedBuilder = new GroupedRouteBuilder(
            prefix,
            this,
            this.completePrefix + prefix,
            _.cloneDeep(this.metadataCollection)
        )

        this.subgroupsRouteBuilder.push(groupedBuilder)

        return groupedBuilder
    }

    buildRouteHandlers(): IRequestHandlerConventions[] {

        const requestHandlerConventions = this.singleRoutesBuilders.reduce((requestHandlerConventions, routeHandlerBuilder) => {
            requestHandlerConventions = [...requestHandlerConventions, ...routeHandlerBuilder.buildRouteHandlers()]
            return requestHandlerConventions
        }, [] as IRequestHandlerConventions[])

        const requestHandlerConventionsSubRoute = this.subgroupsRouteBuilder
            .reduce((requestsHandlersConventions, subRoute) => {
                return [...requestsHandlersConventions, ...subRoute.buildRouteHandlers() ?? []]
            }, [] as IRequestHandlerConventions[])

        return [...requestHandlerConventions, ...requestHandlerConventionsSubRoute]
    }

    buildRouter(): express.Router {
        const router = e.Router()
        const singleRouters = this.singleRoutesBuilders.map(
            singleRouteBuilder => singleRouteBuilder.buildRouter()
        )

        const subgroupRouters = this.subgroupsRouteBuilder.map(subRoute => subRoute.buildRouter())

        router.use(this.prefix, this.middlewares, singleRouters, subgroupRouters)

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
    baseRouteBuilders: BaseRouteBuilder[];
    extensions: (callback: CallbackRouteMapBuilder) => IRouteMapBuilder
}


export type RouteMapBuilderCallBack = (routeMapBuilder: IRouteMapBuilder) => IRouteMapBuilder
export type ConfigureServiceCallback = (services: interfaces.Container) => void
type ConfigureAppEndpointCallback = (services: interfaces.Container) => IAppEndpoint
type AuthentificationBuilderCallback = (builder: AuthentificationBuilder) => void

interface IApp {
    addMiddleware: (...callbacks: RequestHandlerParams[]) => IApp;
    addEndpoint: (callback: RouteMapBuilderCallBack) => IRouteMapBuilder;
    addAppEndpoint: (routeAppHandler: IAppEndpoint | ConfigureAppEndpointCallback) => IApp // A voir c'est bof
    run: () => void;
    configure: (configureServiceCallback: ConfigureServiceCallback) => void;
    mapEndpoints: () => void
    addAuthentification: (handler: RequestHandler, schemes: SecurityType[], callback?: AuthentificationBuilderCallback) => IApp
}

export interface IAppEndpoint {
    route: string,
    handlers: RequestHandler[] | RequestHandlerParams[]
}


type ControllerMethod = (...args: any[]) => any

type ConfigApp = { port?: string }

export class App implements IApp, IRouteMapBuilder {
    private readonly app: Application = express()
    private static readonly services: interfaces.Container = new Container()
    public readonly baseRouteBuilders: BaseRouteBuilder[] = []
    public readonly services: interfaces.Container = App.services
    private readonly config: ConfigApp

    constructor(config: ConfigApp) {
        this.config = config
    }

    addAuthentification(handler: RequestHandler, schemes: SecurityType[], callback?: AuthentificationBuilderCallback): IApp {
        this.services.bind('HandlerAuthentification').toConstantValue(handler)
        this.services.bind('Schemes').toConstantValue(schemes)

        this.services
            .bind(AuthentificationBuilder)
            .to(AuthentificationBuilder)
            .inSingletonScope()

        if (callback) {
            callback(this.services.get(AuthentificationBuilder))
        }

        return this
    }

    configure(configureServiceCallback: ConfigureServiceCallback): void {
        configureServiceCallback(this.services)
    }

    addMiddleware(...callbacks: RequestHandlerParams[]): IApp {
        this.app.use(...callbacks)
        return this
    }

    public static createApp(config: ConfigApp): IApp {
        return new App(config)
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
        for (const baseRouteBuilder of this.baseRouteBuilders) {
            const router = baseRouteBuilder.buildRouter()
            this.app.use(router)
        }
    }

    run(): void {
        this.app.listen(this.config.port ?? 8000, () => {
            console.log(`Server started on port: http://localhost:${this.config.port ?? 8000}/docs`)
        })
    }

    map(
        path: string,
        method: HTTPMethod,
        controllerType: Constructor,
        controllerMethod: ControllerMethod
    ): ISingleRouteBuilder {
        let authentificationBuilder: AuthentificationBuilder | undefined
        if (this.services.isBound(AuthentificationBuilder)) {
            authentificationBuilder = this.services.get(AuthentificationBuilder)
        }

        const singleRouteBuilder = new SingleRouteBuilder(
            new RequestHandlerBuilder(controllerType, controllerMethod, this.services),
            path,
            method,
            '',
            new MetadataCollection(),
            authentificationBuilder
        )

        this.baseRouteBuilders.push(singleRouteBuilder);
        return singleRouteBuilder
    }

    mapGroup(prefix: string): IGroupedRouteBuilder {
        const groupedRouteBuilder = new GroupedRouteBuilder(prefix, this)
        this.baseRouteBuilders.push(groupedRouteBuilder)
        return groupedRouteBuilder
    }

    extensions(callback: CallbackRouteMapBuilder): IRouteMapBuilder {
        callback(this)
        return this;
    }
}

