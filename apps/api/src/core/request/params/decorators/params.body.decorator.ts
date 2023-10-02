import {ParamsDecorator} from "./params.decorator";
import {values} from "lodash";
import 'reflect-metadata'
import {RequestCore, TypesCore} from "core-types";

export class ParamsBodyDecorator extends ParamsDecorator<TypesCore.New> implements RequestCore.Params.IParamsBodyDecorator{
    constructor(
        protected readonly target: Object,
        protected readonly methodName: string
    ) {
        super('body', target, methodName);
    }

    override add(index: number): void {
        if (values(this.metadata).length >= 1) {
            throw new Error('Only one @Body() decorator is allowed in the method.')
        }
        super.add(index);
    }
}

export function Body(
    target: Object,
    methodName: string,
    parameterIndex: number
): void {
    const bodyDecorator = new ParamsBodyDecorator(target, methodName)
    bodyDecorator.add(parameterIndex)
}
