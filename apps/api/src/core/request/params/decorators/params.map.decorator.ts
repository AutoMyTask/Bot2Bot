import {ParamsDecorator} from "./params.decorator";

export class ParamsMapDecorator extends ParamsDecorator<any>{
    constructor(
        protected readonly target: Object,
        protected readonly methodName: string
    ) {
        super('map', target, methodName);
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
