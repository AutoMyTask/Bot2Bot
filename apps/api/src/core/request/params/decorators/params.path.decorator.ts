import {ParamsDecorator} from "./params.decorator";
import {ParamPathType} from "../types";


export class ParamsPathDecorator extends ParamsDecorator<ParamPathType> {
    constructor(
        protected readonly target: Object,
        protected readonly methodName: string | symbol
    ) {
        super('params', target, methodName);
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
