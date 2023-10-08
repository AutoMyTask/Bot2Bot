import {ParamsPathDecorator} from "./decorators/params.path.decorator";
import {ParamsBodyDecorator} from "./decorators/params.body.decorator";
import {ParamsServiceDecorator} from "./decorators/params.service.decorator";
import {Request} from "express";
import {plainToInstance} from "class-transformer";
import {validate} from "class-validator";
import {BadRequestObject} from "../../http/errors/BadRequest";
import {ParamsMapDecorator} from "./decorators/params.map.decorator";
import {IServiceCollection, RequestCore} from "core-types";
import {ParamsQueryDecorator} from "./decorators/params.query.decorator";
import {param, query, ValidationError} from "express-validator";
import {isEmpty} from "lodash";


type ValidatorType = 'isInt' | 'isFloat' | 'isNumeric';

export class ParamsBuilder implements RequestCore.Params.IParamsBuilder {
    private args: RequestCore.Params.ArgHandler[] = []

    // A déplacer dans une classe externe
    private validators: Record<string, { validator: ValidatorType, message: string, parser: (value: string) => number | string }> = {
        int: {
            validator: 'isInt',
            message: 'The parameter should be a integer',
            parser: (value: string): number => parseInt(value)
        },
        float: {
            validator: 'isFloat',
            message: 'The parameter should be a float',
            parser: (value: string): number => parseFloat(value)
        },
        number: {
            validator: 'isNumeric',
            message: 'The parameter should be a number',
            parser: (value: string): number => +value
        }
    }

    constructor(
        public readonly paramsPath: ParamsPathDecorator,
        public readonly paramBody: ParamsBodyDecorator,
        public readonly paramsService: ParamsServiceDecorator,
        public readonly paramsMap: ParamsMapDecorator,
        public readonly paramsQuery: ParamsQueryDecorator,
        private readonly services: IServiceCollection
    ) {
        for (let {index, type} of this.paramsService.values) {
            this.args[index] = this.services.get(type)
        }
    }

    // Ajouter dans la spec openapi, les représentation d'erreur d'express validator
    // Déplacer le code commun dans une classe
    async createQueryArg(req: Request, /* validatorName: 'query' | 'param' */): Promise<ParamsBuilder> {
        for (const {type, name, index, required} of this.paramsQuery.values) {
            const queryParam = req.query[name]

            if (required !== undefined && !required && !queryParam) {
                this.args[index] = undefined
                return this
            }

            if ((required || required === undefined) && !queryParam) {
                throw new BadRequestObject(
                    ['Missing parameter']
                )
            }
            // const expressValidator = expressValidators[validatorName](name)

            const validator = this.validators[type]
            const result = await query(name)[validator.validator]().withMessage(validator.message).run(req)
            if (result.context.errors.length > 0) {
                throw new BadRequestObject(
                    result.context.errors
                )
            }

            if (typeof queryParam === 'string') {
                this.args[index] = validator.parser(queryParam)
            }
        }
        return this
    }

    async createParamsArg(req: Request): Promise<ParamsBuilder> {
        for (const {type, name, index, required} of this.paramsPath.values) {
            const pathParam = req.params[name]

            if (required !== undefined && !required && !pathParam) {
                this.args[index] = undefined
                return this
            }

            if ((required || required === undefined) && !pathParam) {
                throw new BadRequestObject(
                    [`The '${name}' parameter is required in the path.`]
                )
            }

            const validator = this.validators[type]
            const result = await param(name)[validator.validator]().withMessage(validator.message).run(req)
            if (result.context.errors.length > 0) {
                throw new BadRequestObject(
                    result.context.errors
                )
            }

            this.args[index] = validator.parser(pathParam)
        }
        return this
    }



    async createMapArg(req: Request): Promise<ParamsBuilder> {
        for (let {index, name} of this.paramsMap.values) {
            const valReq = req as Record<string, any>

            if (!valReq[name]) {
                throw new Error('une erreur')
            }

            this.args[index] = valReq[name]
        }
        return this
    }

    async createBodyArg(req: Request): Promise<ParamsBuilder> {
        if (!isEmpty(req.body)) {
            const bodyParameter = this.paramBody.values.at(0) // There can be only one body (otherwise, I throw an error -> see @Body() decorator)."

            if (!bodyParameter) {
                throw new Error("indiquer que bodyParameter ne peut pas être nul si req.body n'est pas nul ")
            }

            const body = plainToInstance(bodyParameter.type, req.body)

            const errors = await validate(body)

            if (errors.length > 0) {
                throw new BadRequestObject(
                    errors
                )
            }

            this.args[bodyParameter.index] = body
        }
        return this
    }

    get getArgs(): RequestCore.Params.ArgHandler[] {
        return this.args
    }
}
