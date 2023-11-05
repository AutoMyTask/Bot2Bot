import {IsInt, IsNotEmpty, IsString} from "class-validator";
import {OpenapiProp} from "openapi";


export class UserRequest {
    @IsInt()
    @IsNotEmpty()
    @OpenapiProp({type: 'number'})
    oui!: number


    @IsNotEmpty()
    @IsString()
    @OpenapiProp({type: 'string'})
    non!: string
}
