import {OpenapiProp} from "../../openapi/decorators/openapi.prop";

export class Unauthorized {
    @OpenapiProp(['string'])
    message!: string
}
