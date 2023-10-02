import {ParamsPathDecorator} from "./decorators/params.path.decorator";
import {ParamsBodyDecorator} from "./decorators/params.body.decorator";
import {ParamsServiceDecorator} from "./decorators/params.service.decorator";
import {Request} from "express";
import {isNull} from "lodash";
import {plainToInstance} from "class-transformer";
import {validateSync} from "class-validator";
import {parseNumber} from "../../utils/parse.number";
import {BadRequestObject} from "../../http/errors/BadRequest";
import {ParamsMapDecorator} from "./decorators/params.map.decorator";
import {IServiceCollection, RequestCore} from "api-common";

export class ParamsBuilder implements RequestCore.Params.IParamsBuilder{
    private args: RequestCore.Params.ArgHandler[] = []

    constructor(
        public readonly paramsPath: ParamsPathDecorator,
        public readonly paramBody: ParamsBodyDecorator,
        public readonly paramsService: ParamsServiceDecorator,
        public readonly paramsMap: ParamsMapDecorator,
        private readonly services: IServiceCollection
    ) {
        for (let {index, type} of this.paramsService.values) {
            this.args[index] = this.services.get(type)
        }
    }


    createParamsArg(req: Request): ParamsBuilder {
        for (let {type, name, index} of this.paramsPath.values) {
            if (type === 'float') {
                if (!/^\d+(\.\d+)?$/.test(req.params[name])) {
                    throw new BadRequestObject(
                        `The '${name}' parameter should be a number, but a ${
                            typeof req.params[name]
                        } was provided.`,
                        ['Invalid parameter']
                    )
                }
                this.args[index] = Number.parseFloat(req.params[name])
                return this
            }
            if (type === 'int') {
                if (!/^\d+$/.test(req.params[name])) {
                    throw new BadRequestObject(
                        `The '${name}' parameter should be a number, but a ${
                            typeof req.params[name]
                        } was provided.`,
                        ['Invalid parameter']
                    )
                }
                this.args[index] = Number.parseInt(req.params[name])
                return this
            }

            if (typeof type === "function" && type === Number) {
                const pathParam = parseNumber(req.params[name])
                if (isNull(pathParam)) {
                    throw new BadRequestObject(
                        `The '${name}' parameter should be a number, but a ${
                            typeof req.params[name]
                        } was provided.`,
                        ['Invalid parameter']
                    )
                }
                this.args[index] = pathParam
                return this
            }
            this.args[index] = req.params[name]
        }
        return this
    }

    createMapArg(req: Request): ParamsBuilder {
        for (let {index, name} of this.paramsMap.values) {
            const entry = Object.entries(req).find(([key]) => key === name)

            if (!entry) {
                throw new Error('une erreur')
            }

            const [_, value] = entry

            this.args[index] = value
        }
        return this
    }

    createBodyArg(req: Request): ParamsBuilder {
        const bodyParameter = this.paramBody.values.at(0) // There can be only one body (otherwise, I throw an error -> see @Body() decorator)."

        if (!bodyParameter) {
            throw new Error("indiquer que body ne peut pas être nul si req.body n'est pas nul ")
        }

        const body = plainToInstance(bodyParameter.type, req.body)

        const errors = validateSync(body)

        if (errors.length > 0) {
            throw new BadRequestObject(
                `The provided fields are incorrect`,
                errors
            )
        }

        this.args[bodyParameter.index] = body
        return this
    }

    get getArgs(): RequestCore.Params.ArgHandler[] {
        return this.args
    }
}
