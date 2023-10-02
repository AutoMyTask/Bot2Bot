import {values} from "lodash";
import 'reflect-metadata'
import {RequestCore} from "api-common";

export abstract class ParamsDecorator<T extends RequestCore.Params.ParamType> implements RequestCore.Params.IParamsDecorator<T>{
    public metadata: Record<number, RequestCore.Params.Param<T> & { index: number }> // Utiliser un tableau et non un record

    // A typer
    protected readonly types: any[]

    protected constructor(
        public readonly metadataKey: 'body' | 'services' | 'params' | 'map',
        protected readonly target: Object,
        protected readonly methodName: string | symbol
    ) {
        this.metadata = Reflect.getMetadata(this.metadataKey, target, methodName) ?? {}
        this.types = Reflect.getMetadata('design:paramtypes', target, methodName)
    }

    add(index: number, option?: { required?: boolean, type?: T, name?: string }) {
        const type = option?.type ?? this.types[index]
        const name = option?.name ?? type?.name
        this.metadata[index] = {index, type, name, required: option?.required}
        Reflect.defineMetadata(this.metadataKey, this.metadata, this.target, this.methodName)
    }

    get values(): (RequestCore.Params.Param<T> & { index: number })[] {
        return values(this.metadata)
    }

    // Indiquer qu'il peut être undefenid ! important !
    getParam(index: number): RequestCore.Params.Param<T> & { index: number } {
        return this.metadata[index]
    }
}
