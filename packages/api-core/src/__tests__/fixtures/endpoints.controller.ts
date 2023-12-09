import { Params } from "../../request/params/decorators/params.path.decorator";
import { Query } from "../../request/params/decorators/params.query.decorator";

export class EndpointsController {
  static emptyEndpoint(): boolean {
    return true;
  }

  static endpointGetWithParams(
    @Params("pathNumber") pathNumber: number,
    @Params("pathString") pathString: string,
    @Params("pathInt", "int") pathInt: number,
    @Params("pathFloat", "float") pathFloat: number,
    @Query("queryNumber") queryNumber?: number,
    @Query("queryString") queryString?: string,
    @Query("queryInt", { type: "int" }) queryInt?: number,
    @Query("queryFloat", { type: "float" }) queryFloat?: number,
  ): boolean {
    return true;
  }
}
