import {ParamsDecorator} from "./params.decorator";
import 'reflect-metadata'
import {RequestCore} from "api-core-types";

export class ParamsServiceDecorator extends ParamsDecorator<
    RequestCore.Params.ParamServiceType
> implements RequestCore.Params.IParamsServiceDecorator {
    constructor(
        protected readonly target: Object,
        protected readonly methodName: string | symbol
    ) {
        super('services', target, methodName);
    }

    override add(index: number, option?: { type?: string }) {
        const typeConstructor = this.types[index]

        if (typeConstructor === String || typeConstructor === Number ) {
            throw new Error("Message d'erreur indiquant que tu ne peux pas utiliser number et string")
        }

        const type = option?.type ?? typeConstructor
        const name = option?.type ?? typeConstructor.name
        super.addParameter(index, type, name, undefined)
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

