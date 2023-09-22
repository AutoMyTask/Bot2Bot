import {CreateRequestHandler} from "./types";
import {NextFunction, Request, RequestHandler, Response} from "express";
import {isEmpty} from "lodash";
import {ParamsBuilder} from "./params/params.builder";
import {New} from "../types";
import {interfaces} from "inversify";
import {ParamsPathDecorator} from "./params/decorators/params.path.decorator";
import {ParamsBodyDecorator} from "./params/decorators/params.body.decorator";
import {ParamsServiceDecorator} from "./params/decorators/params.service.decorator";

export class RequestHandlerBuilder {
    public readonly paramsBuilder: ParamsBuilder

    constructor(
        private readonly controllerType: New,
        private readonly controllerFunction: Function,
        public readonly services: interfaces.Container
    ) {
        this.paramsBuilder = new ParamsBuilder(
            new ParamsPathDecorator(controllerType, controllerFunction.name),
            new ParamsBodyDecorator(controllerType, controllerFunction.name),
            new ParamsServiceDecorator(controllerType, controllerFunction.name),
            this.services
        )
    }

    private tryHandler(buildFunction: CreateRequestHandler): RequestHandler {
        return async (req, res, next) => {
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

    public get argsHandler() {
        return this.tryHandler(this.createArgsHandler)
    }

    public get finalHandler(): RequestHandler {
        return this.tryHandler(this.createFinalHandler)
    }

    private createArgsHandler = async (req: Request, res: Response, next: NextFunction) => {
        if (!isEmpty(req.body)) {
            this.paramsBuilder.createBodyArg(req)
        }
        if (!isEmpty(req.params)) {
            this.paramsBuilder.createParamsArg(req)
        }
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
