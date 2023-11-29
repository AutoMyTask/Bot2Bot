import { values } from "lodash";
import { RequestCore, TypesCore } from "api-core-types";
import * as expressValidators from "express-validator";

export abstract class ParamsDecorator<
  TParam extends RequestCore.Params.ParamType,
  TConstructor extends TypesCore.New = TypesCore.New,
> implements RequestCore.Params.IParamsDecorator<TParam>
{
  public metadata: Record<
    number,
    RequestCore.Params.Param<TParam> & { index: number }
  >; // Utiliser un tableau et non un record

  // A typer
  protected readonly types: TConstructor[];

  protected constructor(
    public readonly metadataKey:
      | "body"
      | "services"
      | "params"
      | "map"
      | "query",
    protected readonly target: Object,
    protected readonly methodName: string | symbol,
  ) {
    this.metadata =
      Reflect.getMetadata(this.metadataKey, target, methodName) ?? {};

    this.types = Reflect.getMetadata("design:paramtypes", target, methodName);
  }

  abstract add(
    index: number,
    option?: { required?: boolean; type?: TParam; name?: string },
  ): void;

  get values(): (RequestCore.Params.Param<TParam> & { index: number })[] {
    return values(this.metadata);
  }

  protected addParameter(
    index: number,
    type: TParam,
    name: string,
    required?: boolean,
  ): void {
    this.metadata[index] = { index, type, name, required };
    Reflect.defineMetadata(
      this.metadataKey,
      this.metadata,
      this.target,
      this.methodName,
    );
  }

  // Indiquer qu'il peut être undefenid ! important !
  getParam(
    index: number,
  ): RequestCore.Params.Param<TParam> & { index: number } {
    return this.metadata[index];
  }
}
