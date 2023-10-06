import {ParamsDecorator} from "./params.decorator";
import {RequestCore} from 'core-types'

export class ParamsQueryDecorator extends ParamsDecorator<
    RequestCore.Params.ParamQueryType,
    NumberConstructor | StringConstructor
> implements RequestCore.Params.IParamsQueryDecorator{
    constructor(
        protected readonly target: Object,
        protected readonly methodName: string | symbol
    ) {
        super('query', target, methodName);
    }

    add(index: number, option: { required?: boolean, name: string, type?: 'int' | 'float' }): void {
        const typeConstruct = this.types[index]

        if (typeConstruct !== Number && typeConstruct !== String) {
            throw new Error(`Invalid parameter type for '${option.name}' in method '${this.methodName as string}'. The parameter should be a Number or a String, but a ${typeConstruct.name} was provided.`)
        }

        if (typeConstruct === String && (option?.type === 'int' || option?.type === 'float')) {
            throw new Error(`Invalid parameter type for '${option.name}' in method '${this.methodName as string}'. The parameter should be a Number, but a ${typeConstruct.name} was provided. 'int' or 'float' can only be associated with a 'Number' type for this specific parameter.`);
        }
        const type = option?.type ?? typeConstruct.name.toLowerCase() as RequestCore.Params.ParamQueryType
        super.addParameter(index, type, option.name, option.required)
    }
}



export function Query(
    paramName: string,
    options?: { type?: 'int' | 'float', required?: boolean }
) {
    return (
        target: Object,
        methodName: string,
        parameterIndex: number
    ) => {
        const paramsQuery = new ParamsQueryDecorator(target, methodName)

        if (options) {
            const { type , required} = options
            paramsQuery.add(parameterIndex, { required ,name: paramName, type})
        } else {
            paramsQuery.add(parameterIndex, { name: paramName })
        }


    }
}
