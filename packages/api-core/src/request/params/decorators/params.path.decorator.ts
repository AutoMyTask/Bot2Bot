import {ParamsDecorator} from "./params.decorator";
import 'reflect-metadata'
import {RequestCore} from "api-core-types";

export class ParamsPathDecorator extends ParamsDecorator<
    RequestCore.Params.ParamPathType,
    NumberConstructor | StringConstructor
> implements RequestCore.Params.IParamsPathDecorator{
    constructor(
        protected readonly target: Object,
        protected readonly methodName: string | symbol
    ) {
        super('params', target, methodName);
    }

    override add(index: number, option: { name: string, type?: 'int' | 'float' }): void {
        const typeConstruct = this.types[index]

        if (typeConstruct !== Number && typeConstruct !== String) {
            throw new Error(`Invalid parameter type for '${option.name}' in method '${this.methodName as string}'. The parameter should be a Number or a String, but a ${typeConstruct.name} was provided.`)
        }

        if (typeConstruct === String && (option?.type === 'int' || option?.type === 'float')) {
            throw new Error(`Invalid parameter type for '${option.name}' in method '${this.methodName as string}'. The parameter should be a Number, but a ${typeConstruct.name} was provided. 'int' or 'float' can only be associated with a 'Number' type for this specific parameter.`);
        }


        const type = option?.type ?? typeConstruct.name.toLowerCase() as RequestCore.Params.ParamPathType
        super.addParameter(index, type, option.name)
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
