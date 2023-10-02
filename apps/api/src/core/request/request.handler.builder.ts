import {CreateRequestHandler} from "./types";
import {NextFunction, Request, RequestHandler, Response} from "express";
import {isEmpty} from "lodash";
import {ParamsBuilder} from "./params/params.builder";
import {ParamsPathDecorator} from "./params/decorators/params.path.decorator";
import {ParamsBodyDecorator} from "./params/decorators/params.body.decorator";
import {ParamsServiceDecorator} from "./params/decorators/params.service.decorator";
import {ParamsMapDecorator} from "./params/decorators/params.map.decorator";
import {IServiceCollection, RequestCore, TypesCore} from "core-types";


export class RequestHandlerBuilder implements RequestCore.IRequestHandlerBuilder{
    public readonly paramsBuilder: RequestCore.Params.IParamsBuilder

    constructor(
        private readonly controllerType: TypesCore.New,
        private readonly controllerFunction: Function,
        public readonly services: IServiceCollection
    ) {
        this.paramsBuilder = new ParamsBuilder(
            new ParamsPathDecorator(controllerType, controllerFunction.name),
            new ParamsBodyDecorator(controllerType, controllerFunction.name),
            new ParamsServiceDecorator(controllerType, controllerFunction.name),
            new ParamsMapDecorator(controllerType, controllerFunction.name),
            this.services
        )
    }

    private tryHandler(buildFunction: CreateRequestHandler): RequestHandler {
        return async (req: Request, res: Response, next: NextFunction) => {
            try {
                const result = buildFunction(req, res, next)
                if (result instanceof Promise) {
                    return await result
                }
                return result

            } catch (err: any) {
                next(err)
            }
        }
    }


    public get argsHandler(): RequestHandler {
        return this.tryHandler(this.createArgsHandler)
    }

    public get finalHandler(): RequestHandler {
        return this.tryHandler(this.createFinalHandler)
    }

    private createArgsHandler = async (req: Request, res: Response, next: NextFunction) => {
        if (!isEmpty(req.params)) {
            this.paramsBuilder.createParamsArg(req)
        }
        if (!isEmpty(req.body)) {
            this.paramsBuilder.createBodyArg(req)
        }
        this.paramsBuilder.createMapArg(req)
        req.args = this.paramsBuilder.getArgs
        next()
    }

    private createFinalHandler = async (req: Request, res: Response, next: NextFunction) => {
        const result = this.controllerFunction.apply(this.controllerType, req.args)
        if (result instanceof Promise) {
            return res.json(await result)
        }
        return res.json(result)
    }
}
