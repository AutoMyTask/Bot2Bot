import {ParamsDecorator} from "./params.decorator";
import {ParamServiceType} from "../types";

export class ParamsServiceDecorator extends ParamsDecorator<ParamServiceType> {
    constructor(
        protected readonly target: Object,
        protected readonly methodName: string | symbol
    ) {
        super('services', target, methodName);
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

