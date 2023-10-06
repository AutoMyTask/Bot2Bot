import {ParamsDecorator} from "./params.decorator";
import {RequestCore} from "core-types";

export class ParamsMapDecorator extends ParamsDecorator<any> implements RequestCore.Params.IParamsMapDecorator {
    constructor(
        protected readonly target: Object,
        protected readonly methodName: string
    ) {
        super('map', target, methodName);
    }

    override add(index: number, option?: { required?: boolean; type?: any; name?: string }): void {
        if (!option?.name){
            throw new Error('une erreur')
        }

        super.addParameter(index, undefined, option.name, option.required)
    }
}


export function Map(propToMap: string) {
    return (
        target: Object,
        methodName: string,
        parameterIndex: number
    ) => {
        const mapDecorator = new ParamsMapDecorator(target, methodName)
        mapDecorator.add(parameterIndex, { name: propToMap })
    }
}
