import {IsInt, IsNotEmpty, IsString} from "class-validator";
import {OpenapiProp} from "openapi";


export class UserRequest {
    @IsInt()
    @IsNotEmpty()
    @OpenapiProp(['number'], {required: true})
    oui!: number


    @IsNotEmpty()
    @IsString()
    @OpenapiProp(['string'], {required: true})
    non!: string
}
